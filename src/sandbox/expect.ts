import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Three states rather than two. An arm with no declaration is `unchecked`: it
 * cannot pass, since nothing was asserted, and it does not fail, since failing
 * every undeclared arm would make the harness unusable while expectations roll
 * out. `aitk sandbox coverage` is what keeps the count from hiding.
 */
export type VerdictState = 'pass' | 'fail' | 'unchecked'

export interface ContentAssertion {
  readonly path: string
  readonly pattern: string
}

export interface Expectation {
  readonly paths: readonly string[]
  readonly absent: readonly string[]
  readonly content: readonly ContentAssertion[]
  readonly writeScope: readonly string[]
  readonly manual: readonly string[]
  readonly maxTurns?: number
}

export interface AssertionResult {
  readonly ok: boolean
  readonly message: string
}

export interface RunEnvelope {
  readonly isError: boolean
  readonly turns: number
  readonly denials: number
}

export interface Verdict {
  readonly state: VerdictState
  readonly asserted: number
  readonly failed: number
  readonly unchecked: number
  readonly results: readonly AssertionResult[]
  readonly manual: readonly string[]
  readonly skipped: readonly string[]
  readonly note?: string
}

/**
 * `writes` and `envelope` are absent when the caller supplied no data for them,
 * which is not the same as a run that wrote nothing or reported nothing. The
 * assertion kinds that depend on them report as skipped rather than silently
 * dropping out of the count, so the cheap standalone path cannot claim more
 * coverage than it had.
 */
export interface CheckInput {
  readonly sandboxDir: string
  readonly writes?: readonly string[]
  readonly envelope?: RunEnvelope
}

interface KindOutcome {
  readonly results: AssertionResult[]
  readonly skipped: string[]
}

const EXIT_CODE: Record<VerdictState, number> = {
  pass: 0,
  fail: 1,
  unchecked: 0,
}

/**
 * `unchecked` exits zero so an undeclared arm does not break a gate while
 * expectations roll out. Pass `strict` to make it exit one, which is how a
 * caller that has finished arming its scenarios keeps them armed.
 */
export function verdictExitCode(state: VerdictState, strict = false): number {
  if (strict && state === 'unchecked') return 1

  return EXIT_CODE[state]
}

export interface ScenarioTarget {
  readonly category: string
  readonly command: string
}

/**
 * Splits `<category>:<command>`. Returns undefined rather than a partial target,
 * so a typo cannot resolve to a declaration path that happens not to exist and
 * report `unchecked` on what is really a caller error.
 */
export function parseTarget(target: string): ScenarioTarget | undefined {
  const [category, command, ...rest] = target.split(':')
  if (rest.length > 0) return undefined
  if (category === undefined || category === '') return undefined
  if (command === undefined || command === '') return undefined

  return { category, command }
}

export function expectFilePath(
  root: string,
  category: string,
  command: string,
  arm: string,
): string {
  return join(
    root,
    'scripts',
    'sandbox',
    'fixtures',
    category,
    command,
    arm,
    'expect.toml',
  )
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (entry): entry is string => typeof entry === 'string' && entry !== '',
  )
}

function contentArray(value: unknown): ContentAssertion[] {
  if (!Array.isArray(value)) return []

  const assertions: ContentAssertion[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue

    const record = entry as Record<string, unknown>
    if (typeof record.path !== 'string' || record.path === '') continue
    if (typeof record.pattern !== 'string' || record.pattern === '') continue

    assertions.push({ path: record.path, pattern: record.pattern })
  }

  return assertions
}

/**
 * Throws on malformed TOML. `resolveVerdict` turns that into a failed verdict, so
 * a typo in a declaration reads the same way a pattern that does not compile
 * does, rather than surfacing as a stack trace.
 */
export function parseExpectation(source: string): Expectation {
  const parsed = Bun.TOML.parse(source) as Record<string, unknown>

  return {
    paths: stringArray(parsed.paths),
    absent: stringArray(parsed.absent),
    content: contentArray(parsed.content),
    writeScope: stringArray(parsed.write_scope),
    manual: stringArray(parsed.manual),
    maxTurns:
      typeof parsed.max_turns === 'number' ? parsed.max_turns : undefined,
  }
}

/**
 * `manual` is deliberately excluded. Counting it would let an arm declare five
 * prose lines, assert nothing, and still read green, which is the vacuous case
 * `scripts/core/install-check.sh` warns about in its own comment.
 */
export function countMechanicalAssertions(expectation: Expectation): number {
  return (
    expectation.paths.length +
    expectation.absent.length +
    expectation.content.length +
    expectation.writeScope.length
  )
}

function checkPaths(
  expectation: Expectation,
  sandboxDir: string,
): AssertionResult[] {
  return expectation.paths.map((path) =>
    existsSync(join(sandboxDir, path))
      ? { ok: true, message: `exists: ${path}` }
      : { ok: false, message: `missing: ${path}` },
  )
}

function checkAbsent(
  expectation: Expectation,
  sandboxDir: string,
): AssertionResult[] {
  return expectation.absent.map((path) =>
    existsSync(join(sandboxDir, path))
      ? { ok: false, message: `should not exist: ${path}` }
      : { ok: true, message: `absent: ${path}` },
  )
}

/**
 * A pattern against a missing file reports as a content miss rather than
 * throwing, since an arm may assert content without also listing the path. A
 * pattern that does not compile is a defect in the declaration, so it fails the
 * assertion it belongs to rather than aborting the whole verdict.
 */
function checkContent(
  expectation: Expectation,
  sandboxDir: string,
): AssertionResult[] {
  return expectation.content.map(({ path, pattern }) => {
    const full = join(sandboxDir, path)
    const label = `${path} =~ ${pattern}`

    let matcher: RegExp
    try {
      matcher = new RegExp(pattern, 'm')
    } catch {
      return { ok: false, message: `invalid pattern for ${path}: ${pattern}` }
    }

    if (!existsSync(full) || !statSync(full).isFile()) {
      return { ok: false, message: `no file to match: ${path}` }
    }
    if (matcher.test(readFileSync(full, 'utf8'))) {
      return { ok: true, message: `matches: ${label}` }
    }

    return { ok: false, message: `no match: ${label}` }
  })
}

/**
 * The probe on 2026-07-30 found no permission mode that both allows writes under
 * `.claude/` and scopes them, so the run goes wide and this assertion carries the
 * property the permission layer used to. An arm declaring no scope skips it.
 */
function checkWriteScope(
  expectation: Expectation,
  writes: readonly string[] | undefined,
): KindOutcome {
  if (expectation.writeScope.length === 0) return { results: [], skipped: [] }

  if (writes === undefined) {
    return {
      results: [],
      skipped: ['write scope: no write data supplied, pass --writes'],
    }
  }

  const globs = expectation.writeScope.map((glob) => new Bun.Glob(glob))

  return {
    results: writes.map((path) =>
      globs.some((glob) => glob.match(path))
        ? { ok: true, message: `in scope: ${path}` }
        : { ok: false, message: `wrote outside declared scope: ${path}` },
    ),
    skipped: [],
  }
}

/**
 * The envelope never determines a pass. It can only fail a run the expectations
 * would otherwise have passed. Under `bypassPermissions` the denial count is
 * always zero, so the write-scope assertion is what replaced it.
 */
function checkEnvelope(
  expectation: Expectation,
  envelope: RunEnvelope | undefined,
): KindOutcome {
  if (envelope === undefined) {
    const skipped =
      expectation.maxTurns === undefined
        ? []
        : ['turn ceiling: no envelope supplied, pass --envelope']

    return { results: [], skipped }
  }

  const results: AssertionResult[] = []

  if (envelope.isError) {
    results.push({ ok: false, message: 'envelope: is_error true' })
  }
  if (envelope.denials > 0) {
    results.push({
      ok: false,
      message: `envelope: ${envelope.denials} permission denials`,
    })
  }
  if (
    expectation.maxTurns !== undefined &&
    envelope.turns > expectation.maxTurns
  ) {
    results.push({
      ok: false,
      message: `envelope: ${envelope.turns} turns over ceiling of ${expectation.maxTurns}`,
    })
  }

  return { results, skipped: [] }
}

export function checkExpectation(
  expectation: Expectation,
  input: CheckInput,
): Verdict {
  const scope = checkWriteScope(expectation, input.writes)
  const envelope = checkEnvelope(expectation, input.envelope)

  const results = [
    ...checkPaths(expectation, input.sandboxDir),
    ...checkAbsent(expectation, input.sandboxDir),
    ...checkContent(expectation, input.sandboxDir),
    ...scope.results,
    ...envelope.results,
  ]
  const skipped = [...scope.skipped, ...envelope.skipped]

  const failed = results.filter((result) => !result.ok).length

  // A declaration counts what it declares, this counts what ran, and the two
  // diverge on `write_scope`, which produces one result per write rather than one
  // per glob. An arm declaring only a write scope against a run that wrote
  // nothing would otherwise report pass having asserted nothing, which is the
  // vacuous pass the whole feature exists to remove.
  if (results.length === 0) {
    return {
      state: 'fail',
      asserted: 0,
      failed: 1,
      unchecked: expectation.manual.length + skipped.length,
      results: [
        { ok: false, message: 'no assertion ran against this sandbox' },
        ...results,
      ],
      manual: expectation.manual,
      skipped,
      note: 'The declaration asserts something, but nothing was checkable here. A pass with zero assertions is not a pass.',
    }
  }

  return {
    state: failed > 0 ? 'fail' : 'pass',
    asserted: results.length,
    failed,
    unchecked: expectation.manual.length + skipped.length,
    results,
    manual: expectation.manual,
    skipped,
  }
}

/**
 * A missing declaration and an empty one are different verdicts. Absence is the
 * rollout state for most arms. A declaration that exists and asserts nothing is
 * silent truncation, and it goes red.
 */
export function resolveVerdict(expectFile: string, input: CheckInput): Verdict {
  if (!existsSync(expectFile)) {
    return {
      state: 'unchecked',
      asserted: 0,
      failed: 0,
      unchecked: 0,
      results: [],
      manual: [],
      skipped: [],
      note: `No expect.toml at ${expectFile}. Nothing was asserted.`,
    }
  }

  let expectation: Expectation
  try {
    expectation = parseExpectation(readFileSync(expectFile, 'utf8'))
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)

    return {
      state: 'fail',
      asserted: 0,
      failed: 1,
      unchecked: 0,
      results: [
        { ok: false, message: `expect.toml does not parse: ${reason}` },
      ],
      manual: [],
      skipped: [],
      note: `Fix the declaration at ${expectFile}.`,
    }
  }

  if (countMechanicalAssertions(expectation) === 0) {
    return {
      state: 'fail',
      asserted: 0,
      failed: 1,
      unchecked: expectation.manual.length,
      results: [
        {
          ok: false,
          message: `expect.toml declares no mechanical assertion: ${expectFile}`,
        },
      ],
      manual: expectation.manual,
      skipped: [],
      note: 'An expectation file that asserts nothing passes every run. Declare one or delete the file.',
    }
  }

  return checkExpectation(expectation, input)
}
