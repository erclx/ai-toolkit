import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  isShippedCorpus,
  REFERENCE_MARKER,
  referencesIn,
  SHIPPED_CORPORA,
} from '@/shipped/references'

export interface CommandResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
  /**
   * The two streams interleaved, which is what `2>&1` handed the frame in the
   * script this replaces. A stage borrowing a command's own output pipes this
   * rather than either stream alone.
   */
  readonly all: string
  /**
   * Set when the binary could not be started at all, which is a different state
   * from a binary that ran and refused. An absent tool on a contributor's
   * machine is somebody mid-setup, and an absent tool under CI is a broken
   * workflow step, so the two have to stay distinguishable.
   */
  readonly spawnError?: string
}

export type RunCommand = (argv: readonly string[]) => Promise<CommandResult>

export interface MeasureContext {
  readonly root: string
  /**
   * True where this run is the merge gate rather than a contributor's machine.
   * It decides nothing about what a stage measures and everything about what an
   * absent input means, which is why it reaches a measure at all.
   */
  readonly ci: boolean
  /** Any binary, run from the project root. */
  readonly run: RunCommand
  /**
   * This checkout's own CLI rather than whatever `canon` resolves to on PATH. A
   * globally installed binary resolves to the main checkout no matter which
   * worktree is running, so a gate reading through it would measure the wrong
   * tree and report a pass over a branch it never opened.
   */
  readonly cli: RunCommand
}

export type Emission =
  | { readonly kind: 'info'; readonly text: string }
  | { readonly kind: 'warn'; readonly text: string }
  /** Borrowed output, indented under the stage the way `pipe_output` did. */
  | { readonly kind: 'output'; readonly text: string }

export interface MeasureReport {
  readonly emissions: readonly Emission[]
  /** The stage read its input and found a fact, so the run stops here. */
  readonly failure?: string
  /**
   * The stage could not read its input at all, so it has no verdict to give.
   *
   * Distinct from a pass with nothing to report, which is what six places in
   * the script this replaces used to print. A skip rendered as a passing line
   * reports the pass the stage exists to withhold, so the sequencer renders
   * this as a warning on a contributor's machine and refuses on it under CI.
   */
  readonly unmeasured?: string
}

export type Measure = (ctx: MeasureContext) => Promise<MeasureReport>

const info = (text: string): Emission => ({ kind: 'info', text })
const warn = (text: string): Emission => ({ kind: 'warn', text })
const output = (text: string): Emission => ({ kind: 'output', text })

/**
 * Rules no stack reaches, sorted the way `canon gov list` emits them.
 * `260-shadcn` and `320-tanstack-query` are opt-in libraries a project may not
 * want. `505-at-references` used to sit here too, shipping with no stack on
 * purpose since a rule under `claude/` would reach every base consumer through
 * the folder-whole entry there. Its own install channel, `canon snippets
 * install`, retired with nothing left to deliver it, so `base` now carries
 * `snippets` as a folder-whole entry of its own and the rule reaches every base
 * consumer through that instead.
 *
 * Both are recorded here rather than in a config file: the list is what a
 * reader compares a new arrival against, and a config file would absorb the
 * arrival silently.
 */
export const GOV_EXPECTED_UNREFERENCED = ['260-shadcn', '320-tanstack-query']

/**
 * Scenarios declaring no expectation, taken from `canon sandbox coverage`
 * against a clean tree. Raising it is a deliberate edit that says which
 * scenario shipped unarmed and why.
 */
export const SANDBOX_UNDECLARED_CEILING = 47

/**
 * The retained counts the audit stage compares each run against. Spelled here
 * rather than derived, because this stage only ever names the file in a remedy
 * a reader has to be able to open, and `canon audits run` owns writing it.
 */
export const AUDITS_BASELINE = '.claude/canon/baseline.json'

export const CAPTURE_STAMP_FAILURE =
  'A capture set disagrees with the stamp written when its image was captured. Run canon capture assets --selector .window and commit each frame with its image and its stamp.'

function parseJson(payload: string): unknown {
  try {
    return JSON.parse(payload)
  } catch {
    return undefined
  }
}

/**
 * A rule no stack names is a report rather than a gate. All three standing
 * findings ship that way on purpose, so failing would fail every push over the
 * deliberate case and teach a reader to route around the stage.
 *
 * The catalog is parsed here rather than piped through `bun --eval`, which the
 * script this replaces had to do and had to guard: that interpreter exits 0
 * when its script throws while stdin is a pipe, so a payload that is not JSON
 * printed nothing and exited clean, and empty already means every rule is
 * reached. A sentinel string carried success past that. Parsing in process
 * leaves the two states distinguishable with nothing to carry.
 */
export const unreferencedRules: Measure = async (ctx) => {
  const { exitCode, stdout } = await ctx.cli(['gov', 'list', '--json'])
  if (exitCode !== 0 || stdout.trim() === '') {
    return {
      emissions: [],
      unmeasured: 'The governance catalog did not report.',
    }
  }

  const record = parseJson(stdout) as { unreferenced?: unknown } | undefined
  if (!Array.isArray(record?.unreferenced)) {
    return {
      emissions: [],
      unmeasured:
        'The governance catalog carried no readable unreferenced list.',
    }
  }

  const unreferenced = record.unreferenced.map(String)
  if (unreferenced.length === 0) {
    return { emissions: [info('Every rule is reached by a stack')] }
  }

  const listed = unreferenced.join(' ')
  if (listed === GOV_EXPECTED_UNREFERENCED.join(' ')) {
    return {
      emissions: [
        info(`Reached by no stack: ${listed} (each recorded above with why)`),
      ],
    }
  }

  return {
    emissions: [
      warn(`Reached by no stack: ${listed}`),
      warn(
        `Expected: ${GOV_EXPECTED_UNREFERENCED.join(' ')}. Name the new rule in a stack, or update GOV_EXPECTED_UNREFERENCED in src/gate/measures.ts and say why it reaches no stack.`,
      ),
    ],
  }
}

/**
 * The files the sweep would rewrite, each with its own count, taken from the
 * `paths` array the record carries beside the total.
 *
 * Every field is tested rather than trusted. The record reaches here as parsed
 * JSON rather than as a type the compiler checked, so a shape that moved
 * upstream drops the entries it can no longer read and leaves the count that
 * was read from a field of its own standing.
 */
function citedPaths(record: { paths?: unknown } | undefined): string[] {
  if (!Array.isArray(record?.paths)) return []

  return record.paths.flatMap((entry) => {
    const cited = entry as { path?: unknown; rewritten?: unknown }
    if (typeof cited.path !== 'string') return []
    return typeof cited.rewritten === 'number'
      ? [`${cited.path} (${cited.rewritten})`]
      : [cited.path]
  })
}

/**
 * A second run of the records move should rewrite nothing, and the count is
 * only knowable once the folders themselves have landed.
 *
 * `moves` empty means every record folder already sits at `.canon/`, so any
 * citation the sweep would still rewrite is one the move left stale, which is
 * the defect this stage exists to catch. Where `moves` is nonempty the tree has
 * not migrated at all and a nonzero rewrite count is the verb describing its
 * own first pass, so the reading is reported and never failed on.
 *
 * Exit `0` is a tree with nothing to do and exit `2` is a plan drawn without
 * `--write`, so both read a tree and both carry a record. Every other exit is a
 * refusal that planned nothing, which is unmeasured for the reason the markdown
 * stage treats its own refusal exit so.
 */
export const recordIdempotence: Measure = async (ctx) => {
  const run = await ctx.cli(['migrate', 'records', '--json'])

  if (run.exitCode !== 0 && run.exitCode !== 2) {
    return {
      emissions: [],
      unmeasured: `The records sweep refused (exit ${run.exitCode}) and planned nothing.`,
    }
  }

  const record = parseJson(run.stdout) as
    | { moves?: unknown; rewritten?: unknown; paths?: unknown }
    | undefined
  const moves = record?.moves
  const rewritten = record?.rewritten

  if (!Array.isArray(moves) || typeof rewritten !== 'number') {
    return {
      emissions: [],
      unmeasured:
        'The records sweep carried no plan, so the stage read no count. Run bun src/cli.ts migrate records --json.',
    }
  }

  if (moves.length > 0) {
    return {
      emissions: [
        info(
          `${moves.length} record folder(s) still at the old root, with ${rewritten} citation(s) that move with them`,
        ),
      ],
    }
  }

  if (rewritten > 0) {
    return {
      // The payload already names every file, so listing them here is what
      // separates a count a reader has to go and reproduce from a remedy they
      // can act on. A malformed `paths` costs the list and not the finding,
      // since the count above it was read from a field of its own.
      emissions: citedPaths(record).map((path) => warn(path)),
      failure: `The records are at .canon/ and ${rewritten} citation(s) still name the old root, so a second run of canon migrate records would rewrite them. Repoint each one, or mark it canon-keep-record-root where the sentence has to keep the old spelling.`,
    }
  }

  return {
    emissions: [
      info('Records at .canon/, and a re-run of the move rewrites nothing'),
    ],
  }
}

/**
 * A banned character, word, or spelling is a fact rather than a threshold, so
 * it fails the push while bullet, paragraph, and depth weight stay advisory.
 *
 * The whole corpus is measured rather than the changed files, because a
 * `Do not use` bullet added to a standard bans a token retroactively and no
 * file in the push that adds it was edited.
 *
 * `--json` sends the record to stdout and the frame to stderr, so a passing run
 * stays silent and a failing one is re-run for its frame rather than parsed out
 * of a stream this stage would have to strip.
 */
export const markdownBans: Measure = async (ctx) => {
  const { exitCode } = await ctx.cli(['markdown', 'audit', '--json'])

  if (exitCode === 0) {
    return { emissions: [info('No banned character, word, or spelling')] }
  }

  if (exitCode === 1) {
    return {
      emissions: [],
      unmeasured: 'The markdown audit refused and measured nothing.',
    }
  }

  if (exitCode === 3) {
    return {
      emissions: [],
      failure:
        'The markdown audit shipped an empty ban set, so the corpus was walked and nothing was looked for. Check src/markdown/bans.ts.',
    }
  }

  if (exitCode === 2) {
    const frame = await ctx.cli(['markdown', 'audit'])
    return {
      emissions: [output(frame.all)],
      failure:
        'Markdown prose carries a banned character, word, or spelling. Rewrite the sentence, and reach for a code span only where the token is genuinely an identifier under discussion.',
    }
  }

  return {
    emissions: [],
    failure: `The markdown audit exited ${exitCode}, which is neither a pass nor a finding.`,
  }
}

/**
 * The markdown stage audits this repository. The seed tree ships into every
 * scaffolded project, so a seed breaking the standard it seeds propagates
 * instead of sitting still, and no rule path reaches the tree to report it.
 *
 * `--gate` fails on the two findings beside citations that are facts, a missing
 * required section and index drift, and leaves the thresholds advisory for the
 * reason the stage above leaves its own so.
 *
 * The roots are discovered rather than listed, through the one bash definition
 * `check-seed-independence.sh` already reads, so a stack seeding `.claude/`
 * later is covered with no edit here and the two stages cannot disagree about
 * which roots exist.
 */
export const seedStandards: Measure = async (ctx) => {
  const roots = await ctx.run([
    'bash',
    join(ctx.root, 'scripts/core/list-seed-roots.sh'),
  ])

  if (roots.exitCode !== 0) {
    return {
      emissions: [],
      unmeasured: 'The seed roots could not be listed, so no seed was read.',
    }
  }

  const seedRoots = roots.stdout.split('\n').filter((line) => line !== '')
  if (seedRoots.length === 0) {
    return {
      emissions: [],
      unmeasured: 'No seed root carries .claude/, so nothing was measured.',
    }
  }

  const emissions: Emission[] = []
  let measured = 0

  for (const seedRoot of seedRoots) {
    const run = await ctx.cli([
      'context',
      'audit',
      seedRoot,
      '--gate',
      '--json',
    ])

    // The audit separates 1 from 2 and they mean opposite things. 2 is a seed
    // breaking the standard it seeds. 1 is the audit refusing, which a seed
    // root carrying a `.claude/` but no audited folder produces, and reporting
    // that as a violation sends a reader hunting one that does not exist.
    if (run.exitCode === 1) {
      emissions.push(
        warn(`${seedRoot}: no audited folder under .claude/, nothing measured`),
      )
      continue
    }

    if (run.exitCode !== 0) {
      const frame = await ctx.cli(['context', 'audit', seedRoot, '--gate'])
      emissions.push(output(frame.all))
      return {
        emissions,
        failure:
          run.exitCode === 2
            ? `A seed breaks the standard governing the folder it seeds: ${seedRoot}`
            : `The seed audit exited ${run.exitCode} against ${seedRoot}, which is neither a pass nor a finding.`,
      }
    }

    const entries = seedEntryCount(run.stdout)
    measured += entries
    emissions.push(
      entries === 0
        ? warn(
            `${seedRoot}: no entry under an audited folder, nothing measured`,
          )
        : info(`${seedRoot}: ${entries} entries measured`),
    )
  }

  if (measured === 0) {
    return {
      emissions,
      unmeasured: 'No seed entry was measured, so the stage covered nothing.',
    }
  }

  return { emissions }
}

/**
 * Entries the audit actually measured, summed across the folders it resolved.
 *
 * A root can resolve a folder and measure nothing in it, which is a passing
 * gate over an empty set. The caller states this per root rather than reporting
 * one verdict for every root, or a tree nobody measured reads as a tree that
 * passed.
 */
export function seedEntryCount(payload: string): number {
  const record = parseJson(payload) as
    | { folders?: { entries?: unknown }[] }
    | undefined
  const folders = Array.isArray(record?.folders) ? record.folders : []
  return folders.reduce(
    (total, folder) =>
      total + (typeof folder.entries === 'number' ? folder.entries : 0),
    0,
  )
}

/**
 * Scoped to arrival rather than the corpus, since `standards/standard.md`
 * forbids writing a criterion into an existing standard outside the change that
 * exercises it. Gating the known gaps would fail every push until someone
 * closed them all, which is the sweep that rule exists to prevent.
 */
export const standardCriteria: Measure = async (ctx) => {
  const run = await ctx.cli(['standards', 'audit', '--arrivals-only'])

  if (run.exitCode === 0) {
    return { emissions: [info('Arriving standards carry a success criterion')] }
  }

  return {
    emissions: [output(run.all)],
    failure:
      run.exitCode === 2
        ? 'A standard new to this branch carries no ## Success criterion section. Run bun src/cli.ts standards audit.'
        : 'canon standards audit could not read which standards arrived on this branch. Run bun src/cli.ts standards audit --json to see why.',
  }
}

/**
 * Every file in the gated corpus, walked from `ctx.root` rather than from the
 * changed set.
 *
 * The stage's `scope` already decides whether the run happens at all, and once
 * it does the whole corpus is read. A walk keyed on the diff would pass a
 * branch that moved a reference between two files without changing it, and the
 * corpus is a few hundred text files, so reading it whole costs the stage
 * nothing it would notice.
 *
 * `dot` is what reaches the seeds, which is half of what `tooling/` ships. Every
 * seeded `.claude/` tree, `.cspell/` list, and `.husky/` hook sits behind a
 * dotted segment, so the default scan walks `tooling/` and returns none of the
 * files a scaffolded project actually receives.
 */
function shippedCorpusFiles(root: string): string[] {
  const files: string[] = []

  for (const corpus of SHIPPED_CORPORA) {
    const dir = join(root, corpus)
    if (!existsSync(dir)) continue

    for (const relative of new Bun.Glob('**/*').scanSync({
      cwd: dir,
      onlyFiles: true,
      dot: true,
    })) {
      const path = `${corpus}/${relative}`
      if (isShippedCorpus(path)) files.push(path)
    }
  }

  return files.sort()
}

/**
 * A pull request number or a commit sha that a reader in a target cannot
 * resolve, over the seven corpora that reach one.
 *
 * Every instance on the trunk was written by a branch that passed review, this
 * row's own planning session included, so the only instrument before this stage
 * was a person noticing. That is the argument for gating rather than reporting:
 * `canon labels audit` already demonstrated that a finding nobody gates on goes
 * unread until a range happens to include it, and the count here grew from six
 * to eighteen while a report was the only instrument.
 *
 * It is a prose pattern rather than a resolution. Nothing here asks GitHub
 * whether a number resolves, so a genuinely reachable citation written bare
 * fails it. That is the intended direction, since the repair is one token and
 * the alternative is a network read inside `bun run check`.
 *
 * The whole set is emitted before the failure returns. A stage halts the run on
 * its first failing check, so a branch carrying several references would
 * otherwise see one and repair one.
 */
export const shippedReferences: Measure = async (ctx) => {
  const files = shippedCorpusFiles(ctx.root)

  if (files.length === 0) {
    return {
      emissions: [],
      unmeasured: `No corpus under ${SHIPPED_CORPORA.join(', ')} is present, so no shipped file was read.`,
    }
  }

  const found = files.flatMap((file) =>
    referencesIn(file, readFileSync(join(ctx.root, file), 'utf8')),
  )

  if (found.length === 0) {
    return {
      emissions: [
        info(
          `No unresolvable reference across ${files.length} files in ${SHIPPED_CORPORA.length} shipped corpora`,
        ),
      ],
    }
  }

  return {
    emissions: found.map((reference) =>
      warn(
        `${reference.file}:${reference.line} carries ${reference.text}, a ${reference.kind === 'commit' ? 'commit sha that resolves nowhere' : 'pull request number that resolves elsewhere'} for a reader in a target`,
      ),
    ),
    failure:
      found.length === 1
        ? `One reference in the shipped corpora names this repository without saying so. Qualify it as owner/repo#123 or owner/repo@abc1234, or mark the line ${REFERENCE_MARKER}: <reason> where the bare form is the point.`
        : `${found.length} references in the shipped corpora name this repository without saying so. Qualify each as owner/repo#123 or owner/repo@abc1234, or mark the line ${REFERENCE_MARKER}: <reason> where the bare form is the point.`,
  }
}

/**
 * `canon sandbox coverage` moves only when a person runs it, so a scenario added
 * with no expectation ships unnoticed.
 *
 * The gate is an absolute count of undeclared scenarios rather than a ratio or
 * a floor under the declared count. A floor passes the case this exists to
 * catch, since adding an unarmed scenario leaves that number where it was. A
 * ratio moves when a scenario is legitimately deleted, and this ceiling does
 * not: deleting an unarmed scenario lowers it and deleting an armed one leaves
 * it alone.
 */
export const sandboxCoverage: Measure = async (ctx) => {
  const run = await ctx.cli(['sandbox', 'coverage', '--json'])

  if (run.exitCode !== 0) {
    return {
      emissions: [],
      unmeasured: `The scenario tree did not report (exit ${run.exitCode}). It ships in the checkout, so a run that does not report is a broken command rather than an absent tree.`,
    }
  }

  const record = parseJson(run.stdout) as
    | { totalScenarios?: unknown; armedScenarios?: unknown }
    | undefined
  const total = record?.totalScenarios
  const armed = record?.armedScenarios

  if (typeof total !== 'number' || typeof armed !== 'number') {
    return {
      emissions: [],
      failure:
        'The coverage report carried no scenario totals, so the stage measured nothing. Run bun src/cli.ts sandbox coverage --json.',
    }
  }

  const undeclared = total - armed
  if (undeclared > SANDBOX_UNDECLARED_CEILING) {
    return {
      emissions: [],
      failure: `${undeclared} of ${total} scenarios declare no expectation, over the ceiling of ${SANDBOX_UNDECLARED_CEILING}. Declare expectations on the new scenario, or raise SANDBOX_UNDECLARED_CEILING in src/gate/measures.ts and say which scenario shipped unarmed.`,
    }
  }

  return {
    emissions: [
      info(
        `${armed} of ${total} scenarios declare expectations, ${undeclared} undeclared against a ceiling of ${SANDBOX_UNDECLARED_CEILING}`,
      ),
    ],
  }
}

/** The flat scalars `canon audits run --json` publishes for a caller to read. */
interface AuditSummary {
  readonly grown?: number
  readonly shrunk?: number
  readonly facts?: number
  readonly unmeasured?: number
  readonly absent?: number
  readonly unrecorded?: number
}

/**
 * The three stages gating on the three findings here that are facts sit above,
 * and this stage reports the rest. It runs the whole set anyway rather than
 * only what those stages skip, because the aggregate's own value is one verdict
 * over every audit, and a stage measuring a subset would report a health this
 * repository never took.
 *
 * This reports and never fails. Growth in a judgment count is the thing the
 * baseline exists to make visible, and failing a push on one would teach a
 * contributor to route around the stage. A fact still fails the push, at the
 * specific stage above that names its own remedy.
 */
export const auditSet: Measure = async (ctx) => {
  const run = await ctx.cli(['audits', 'run', '--json'])

  if (run.stdout.trim() === '') {
    return {
      emissions: [],
      unmeasured: `The audit set did not report (exit ${run.exitCode}).`,
    }
  }

  const record = parseJson(run.stdout) as { summary?: AuditSummary } | undefined
  const summary = record?.summary

  // An absent field is a record this stage cannot read, which is not the same
  // as a run with nothing to report. Reading it as zero would print a clean
  // line over a summary nobody parsed.
  if (
    typeof summary?.grown !== 'number' ||
    typeof summary.facts !== 'number' ||
    typeof summary.unmeasured !== 'number'
  ) {
    return {
      emissions: [],
      unmeasured:
        'The audit record carried no summary, so this stage measured nothing. Run bun src/cli.ts audits run.',
    }
  }

  const emissions: Emission[] = []

  // An absent per-machine folder is the ordinary state here rather than a
  // finding, since every one of them is gitignored and CI carries none. It is
  // still stated, because a stage naming only what it measured claims a
  // coverage it does not have.
  if (typeof summary.absent === 'number' && summary.absent > 0) {
    emissions.push(
      info(
        `${summary.absent} per-machine corpus/corpora absent, so unmeasured here by design`,
      ),
    )
  }
  if (summary.unmeasured > 0) {
    emissions.push(
      warn(
        `${summary.unmeasured} audit(s) did not report, so the set is incomplete. Run bun src/cli.ts audits run.`,
      ),
    )
  }
  if (summary.facts > 0) {
    emissions.push(
      warn(
        `${summary.facts} audit(s) carry a finding that is a fact. The stage above names the remedy.`,
      ),
    )
  }
  if (typeof summary.unrecorded === 'number' && summary.unrecorded > 0) {
    emissions.push(
      warn(
        `${summary.unrecorded} tracked audit(s) have no recorded floor. Take one with bun src/cli.ts audits run --record.`,
      ),
    )
  }
  emissions.push(
    summary.grown > 0
      ? warn(
          `${summary.grown} measure(s) grew against ${AUDITS_BASELINE}. Run bun src/cli.ts audits run to see which, then fix them or re-record and say why.`,
        )
      : info(`No measure grew against ${AUDITS_BASELINE}`),
  )
  if (typeof summary.shrunk === 'number' && summary.shrunk > 0) {
    emissions.push(
      info(`${summary.shrunk} measure(s) fell against ${AUDITS_BASELINE}`),
    )
  }

  return { emissions }
}

/**
 * The plugin is the second delivery path and this is the only stage gating it,
 * so an absent binary is a contributor's machine rather than a clean tree. A
 * runner installs the CLI as a workflow step, which makes an absent binary
 * there a broken workflow, and passing would report a verdict for every
 * manifest on the way to a marketplace install.
 *
 * A global install can also land the wrapper and no platform-native binary,
 * which resolves on PATH and cannot run, so the two states are separated by
 * whether the spawn started at all rather than by a second lookup.
 */
export const pluginManifests: Measure = async (ctx) => {
  const version = await ctx.run(['claude', '--version'])

  if (version.spawnError !== undefined) {
    return {
      emissions: [],
      unmeasured:
        'claude is not installed, so no manifest was read. CI installs it before this stage, so read the Install Plugin CLI step in .github/workflows/verify.yml.',
    }
  }

  if (version.exitCode !== 0) {
    return {
      emissions: [],
      unmeasured:
        'claude is on PATH and claude --version fails, so the install brought down no platform-native binary and no manifest was read. Raise or lower the pinned version at the Install Plugin CLI step in .github/workflows/verify.yml, and record the move in .claude/context/ci.md.',
    }
  }

  const manifests = await collectPluginManifests(ctx)
  if (manifests.length === 0) {
    return {
      emissions: [],
      unmeasured:
        'No plugin or marketplace manifest is present, so none was validated.',
    }
  }

  for (const manifest of manifests) {
    const run = await ctx.run([
      'claude',
      'plugin',
      'validate',
      '--strict',
      manifest,
    ])
    if (run.exitCode !== 0) {
      return {
        emissions: [output(run.all)],
        failure: `Manifest validation failed: ${manifest}`,
      }
    }
  }

  return { emissions: [info('Manifests valid')] }
}

/**
 * Whatever plugin and marketplace manifests the repository currently carries,
 * so the stage picks up a new one without an edit here. Both listings honor
 * `.gitignore`, which keeps linked worktrees and dependency copies out.
 */
async function collectPluginManifests(ctx: MeasureContext): Promise<string[]> {
  const patterns = [
    '*.claude-plugin/plugin.json',
    '*.claude-plugin/marketplace.json',
  ]
  const tracked = await ctx.run(['git', 'ls-files', '--', ...patterns])
  const untracked = await ctx.run([
    'git',
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    ...patterns,
  ])

  const seen = new Set(
    `${tracked.stdout}\n${untracked.stdout}`
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== ''),
  )
  return [...seen].sort()
}

const CAPTURE_DIR = 'assets'

/**
 * Every capture under `assets/`, named by the base its three files share.
 *
 * Read off the folder rather than listed, and off the markup specifically,
 * because that is how `resolveCaptureSources` decides what `canon capture
 * assets` renders. A list would fail open on the frame somebody adds next,
 * which is the one nobody thinks to add here, and driving off the PNGs instead
 * would report a missing set for any image in the folder that is not a capture.
 */
function captureBases(root: string): string[] {
  const dir = join(root, CAPTURE_DIR)
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((name) => name.endsWith('.html'))
    .map((name) => name.slice(0, -'.html'.length))
    .sort()
}

/**
 * The drift assert on the Hero stage covers the markup because the image beside
 * it is a chromium render whose bytes move with the browser. That leaves the
 * artifact a visitor actually sees asserted nowhere, so a branch regenerating
 * the markup and never running the capture would pass every stage while
 * shipping an image with the old counts.
 *
 * `canon capture` records a digest of the markup it rendered and one of the image
 * it wrote, so this reads provenance rather than timing. Comparing the commit
 * that last touched each file passes any pair that moved together whatever the
 * two files hold, which is what a binary conflict resolved by taking either
 * side produces.
 *
 * Both digests are checked because either file can move alone. The markup side
 * catches an edit committed with no capture, and the image side catches an
 * image replaced under markup that never changed. A tree carrying no markup
 * under `assets/` has no set to read and passes, which is correct.
 */
export const captureStamps: Measure = async (ctx) => {
  const lines = captureBases(ctx.root).flatMap((base) =>
    readCaptureSet(ctx.root, base),
  )
  if (lines.length === 0) return { emissions: [] }

  return {
    emissions: [output(lines.join('\n'))],
    failure: CAPTURE_STAMP_FAILURE,
  }
}

/** One capture set, as the lines it has to report and none where it agrees. */
function readCaptureSet(root: string, base: string): string[] {
  const set = (['html', 'png', 'stamp'] as const).map(
    (extension) => `${CAPTURE_DIR}/${base}.${extension}`,
  )

  const missing = set.filter((rel) => !existsSync(join(root, rel)))
  if (missing.length > 0) {
    return [`Missing from the ${base} set: ${missing.join(' ')}`]
  }

  const [html, png, stamp] = set.map((rel) => join(root, rel))
  return [
    ...assertStampField(root, stamp, 'source-sha256', html),
    ...assertStampField(root, stamp, 'image-sha256', png),
  ]
}

/**
 * One digest the stamp recorded against the file it was taken over, returning
 * the lines to report and nothing when the two agree.
 *
 * An absent field reports itself rather than comparing against an empty string,
 * so a stamp predating the current format is distinguishable from a file that
 * moved. Both names in the message come off the paths rather than from
 * arguments, which is what keeps a name from disagreeing with the file it
 * labels once a second capture source calls this.
 */
export function assertStampField(
  root: string,
  stamp: string,
  field: string,
  file: string,
): string[] {
  const stampLabel = relativeTo(root, stamp)
  const fileLabel = relativeTo(root, file)

  const recorded = readStampField(stamp, field)
  if (recorded === undefined) {
    return [
      `${stampLabel} carries no ${field} line, so it predates the capture that writes one.`,
    ]
  }

  const actual = createHash('sha256').update(readFileSync(file)).digest('hex')
  if (recorded !== actual) {
    return [
      `${stampLabel} records ${field} ${recorded}`,
      `${fileLabel} hashes to ${actual}`,
    ]
  }

  return []
}

function readStampField(stamp: string, field: string): string | undefined {
  for (const line of readFileSync(stamp, 'utf8').split('\n')) {
    const [key, value] = line.trim().split(/\s+/)
    if (key === `${field}:` && value !== undefined) return value
  }
  return undefined
}

function relativeTo(root: string, path: string): string {
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path
}
