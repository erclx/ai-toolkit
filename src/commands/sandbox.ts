import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { PROJECT_ROOT, execScript } from '@/exec'
import {
  collectCoverage,
  coveragePercent,
  type CoverageReport,
} from '@/sandbox/coverage'
import {
  expectFilePath,
  parseTarget,
  resolveVerdict,
  verdictExitCode,
  type RunEnvelope,
  type Verdict,
} from '@/sandbox/expect'
import {
  intro,
  logError,
  logInfo,
  logRemove,
  logStep,
  logWarn,
  outro,
  select,
} from '@/ui'

const SANDBOX_DIR = join(PROJECT_ROOT, 'scripts', 'sandbox')

/**
 * Holds fixture content for scenarios rather than scenarios of its own.
 * Twin of the `-not -name fixtures` filter in `scripts/manage-sandbox.sh`.
 */
const FIXTURES_DIR = 'fixtures'

/** A run that reported nothing counts as clean, so only real signals fail. */
const CLEAN_ENVELOPE: RunEnvelope = { isError: false, turns: 0, denials: 0 }

interface CheckOptions {
  readonly envelope?: string
  readonly writes?: string
  readonly json?: boolean
  readonly strict?: boolean
}

interface CoverageOptions {
  readonly json?: boolean
  readonly strict?: boolean
}

function getCategories(): string[] {
  return readdirSync(SANDBOX_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== FIXTURES_DIR)
    .map((d) => d.name)
    .sort()
}

function getCommands(category: string): string[] {
  return readdirSync(join(SANDBOX_DIR, category), { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.sh'))
    .map((f) => f.name.replace(/\.sh$/, ''))
    .sort()
}

async function interactivePicker(): Promise<string> {
  intro('aitk sandbox')

  const categories = getCategories()
  const category = await select({
    message: 'Select category:',
    options: categories.map((c) => ({ value: c, label: c })),
  })

  const commands = getCommands(category)
  const command = await select({
    message: 'Select command:',
    options: commands.map((c) => ({ value: c, label: c })),
  })

  return `${category}:${command}`
}

/**
 * Reads the `claude -p --output-format json` envelope. Returns undefined when no
 * file was given, so the turn ceiling reports as skipped rather than passing on a
 * fabricated zero. A file that exists but does not parse falls back to clean,
 * since decision 8 lets the envelope fail a run but never pass one.
 */
function readEnvelope(path: string | undefined): RunEnvelope | undefined {
  if (path === undefined) return undefined
  if (!existsSync(path)) return CLEAN_ENVELOPE

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<
      string,
      unknown
    >
    const denials = parsed.permission_denials

    return {
      isError: parsed.is_error === true,
      turns: typeof parsed.num_turns === 'number' ? parsed.num_turns : 0,
      denials: Array.isArray(denials) ? denials.length : 0,
    }
  } catch {
    return CLEAN_ENVELOPE
  }
}

/**
 * Undefined when no file was given, which is not the same as a run that wrote
 * nothing. The write-scope assertion needs that distinction: an empty list is a
 * finding, an absent list is a gap in what the caller supplied.
 */
function readWrites(path: string | undefined): string[] | undefined {
  if (path === undefined) return undefined
  if (!existsSync(path)) return []

  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

/**
 * The unchecked count rides the summary line in every verdict, including a pass.
 * It is the number the rollout is measured by, and a count that surfaces only on
 * arms that happen to carry prose is a count nobody drains.
 */
function reportVerdict(verdict: Verdict): void {
  if (verdict.results.length > 0) {
    logStep('Checking expectations')
    for (const result of verdict.results) {
      if (result.ok) logInfo(result.message)
      else logRemove(result.message)
    }
  }

  if (verdict.manual.length > 0) {
    logStep('Not checked (needs a reader)')
    for (const line of verdict.manual) logWarn(line)
  }

  if (verdict.skipped.length > 0) {
    logStep('Not checked (no data supplied)')
    for (const line of verdict.skipped) logWarn(line)
  }

  logStep(`Verdict: ${verdict.state.toUpperCase()}`)
  if (verdict.note !== undefined) logWarn(verdict.note)

  const summary = `${verdict.asserted} asserted, ${verdict.failed} failed, ${verdict.unchecked} unchecked`
  if (verdict.state === 'unchecked') logWarn(summary)
  else logInfo(summary)
}

/**
 * Lists the undeclared scenarios by name rather than counting them. A percentage
 * alone is a number nobody acts on, while a name is the next thing to arm.
 */
function reportCoverage(report: CoverageReport): void {
  const armed = report.scenarios.filter((s) => s.armed.length > 0)
  const bare = report.scenarios.filter((s) => s.armed.length === 0)

  if (armed.length > 0) {
    logStep('Declares expectations')
    for (const scenario of armed) {
      logInfo(
        `${scenario.category}:${scenario.command} (${scenario.armed.join(', ')})`,
      )
    }
  }

  if (bare.length > 0) {
    logStep('Provisions only, asserts nothing')
    for (const scenario of bare)
      logWarn(`${scenario.category}:${scenario.command}`)
  }

  logStep('Coverage')
  const summary =
    `${report.armedScenarios}/${report.totalScenarios} scenarios declared ` +
    `(${coveragePercent(report)}%), ${report.armedArms} armed arms`
  if (bare.length > 0) logWarn(summary)
  else logInfo(summary)
}

function runCoverage(options: CoverageOptions): void {
  intro('aitk sandbox coverage')

  const report = collectCoverage(PROJECT_ROOT)
  reportCoverage(report)
  if (options.json === true) process.stdout.write(`${JSON.stringify(report)}\n`)

  outro()
  process.exitCode =
    options.strict === true && report.armedScenarios < report.totalScenarios
      ? 1
      : 0
}

function runCheck(
  target: string,
  arm: string | undefined,
  options: CheckOptions,
): void {
  intro('aitk sandbox check')

  const parsed = parseTarget(target)
  if (parsed === undefined) {
    logError('Invalid target. Use <category>:<command>, e.g. claude:docs.')
    outro()
    process.exitCode = 1
    return
  }

  // A sandbox that was never provisioned fails every path assertion, reading as a
  // skill that did nothing rather than a caller that ran check too early. The
  // whole point of a verdict is that it means what it says.
  const sandboxDir = join(PROJECT_ROOT, '.sandbox')
  if (!existsSync(sandboxDir)) {
    logError(`No sandbox at ${sandboxDir}. Provision one with aitk sandbox.`)
    outro()
    process.exitCode = 1
    return
  }

  const verdict = resolveVerdict(
    expectFilePath(PROJECT_ROOT, parsed.category, parsed.command, arm ?? ''),
    {
      sandboxDir,
      writes: readWrites(options.writes),
      envelope: readEnvelope(options.envelope),
    },
  )

  // The report always renders on stderr. `--json` adds the machine copy on
  // stdout rather than replacing the frame, per the stream contract in
  // `docs/agents.md`, so one invocation serves a human and a caller at once.
  reportVerdict(verdict)
  if (options.json === true)
    process.stdout.write(`${JSON.stringify(verdict)}\n`)

  outro()
  process.exitCode = verdictExitCode(verdict.state, options.strict === true)
}

export function register(program: Command): void {
  const sandbox = program
    .command('sandbox')
    .description('Provision and run sandbox scenarios')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .action(async (_opts: unknown, cmd: Command) => {
      const args = cmd.args

      if (args.length === 0) {
        const resolved = await interactivePicker()
        await execScript('manage-sandbox.sh', ['--no-header', resolved])
      } else {
        await execScript('manage-sandbox.sh', args)
      }
    })

  sandbox
    .command('check')
    .description('Check a provisioned sandbox against a scenario expectation')
    .argument('<target>', 'Scenario as <category>:<command>, e.g. claude:docs')
    .argument('[arm]', 'Named scenario arm, e.g. drift')
    .helpOption('-h, --help', 'Show this help message')
    .option('--envelope <file>', 'Run envelope JSON from claude -p')
    .option('--writes <file>', 'Newline-delimited paths the session wrote')
    .option('--json', 'Emit the verdict as JSON on stdout')
    .option('--strict', 'Exit non-zero when the arm declares no expectation')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  aitk sandbox check claude:docs drift',
        '  aitk sandbox check claude:docs drift --envelope run.json --json',
        '',
        'Exit codes: 0 on pass or unchecked, 1 on failure.',
        'With --strict, unchecked exits 1 as well.',
      ].join('\n'),
    )
    .action(
      (target: string, arm: string | undefined, options: CheckOptions) => {
        runCheck(target, arm, options)
      },
    )

  sandbox
    .command('coverage')
    .description('Report which scenarios declare expectations')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Emit the report as JSON on stdout')
    .option('--strict', 'Exit non-zero while any scenario declares nothing')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  aitk sandbox coverage',
        '  aitk sandbox coverage --json',
        '',
        'Exit codes: 0 always, unless --strict and a scenario declares nothing.',
      ].join('\n'),
    )
    .action((options: CoverageOptions) => {
      runCoverage(options)
    })
}
