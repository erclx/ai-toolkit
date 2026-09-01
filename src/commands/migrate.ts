import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { listRepositoryFiles } from '@/git-files'
import { applyRecordsMove, applyRename, readSources } from '@/migrate/apply'
import { isToolkitOwned, planRename, type RenamePlan } from '@/migrate/plan'
import {
  ignoresDestination,
  planRecordsMove,
  type RecordsPlan,
} from '@/migrate/records'
import { logError, logInfo, logStep, logWarn, pipeOutput, plural } from '@/ui'

interface RenameOptions {
  readonly json?: boolean
  readonly write?: boolean
  readonly root?: string
  readonly scope?: string
}

const SCOPES = ['self', 'target'] as const

type Scope = (typeof SCOPES)[number]

function isScope(value: string): value is Scope {
  return (SCOPES as readonly string[]).includes(value)
}

/**
 * Reports rather than writes without `--write`, matching `canon records
 * migrate`. A rename touching this many files has no undo short of the branch
 * it ran on, so the safe outcome sits on the default path.
 */
async function runRename(opts: RenameOptions): Promise<number> {
  const root = opts.root ?? process.cwd()
  const scope = opts.scope ?? 'self'

  if (!isScope(scope)) {
    logError(`Unknown scope ${scope}. Use one of ${SCOPES.join(', ')}.`)
    return 1
  }

  const files = await listRepositoryFiles(root)
  if (files === undefined) {
    logError(`Could not list files under ${root}. Is it a git repository?`)
    return 1
  }

  const scoped = scope === 'target' ? files.filter(isToolkitOwned) : files
  const sources = await readSources(root, scoped)
  const plan = planRename(sources)

  // A target scope reports the citations it did not rewrite, since prose the
  // project wrote is theirs to change and a sweep editing it underneath them
  // is the failure this scope exists to avoid.
  const citations =
    scope === 'target'
      ? planRename(
          await readSources(
            root,
            files.filter((f) => !isToolkitOwned(f)),
          ),
        ).entries.length
      : 0

  if (opts.json) {
    pipeOutput(
      JSON.stringify(toRecord(plan, scope, citations, opts.write), null, 2),
    )
  }

  report(plan, scope, citations)

  if (plan.entries.length === 0) return 0
  if (!opts.write) {
    logWarn('Nothing was written. Pass --write to apply this plan.')
    return 2
  }

  const applied = await applyRename(root, plan)
  logStep(
    `Rewrote ${plural(applied.written, 'file')} and moved ${plural(applied.moved, 'path')}.`,
  )

  if (applied.failed.length > 0) {
    logError(`Could not move ${plural(applied.failed.length, 'path')}.`)
    for (const path of applied.failed) logError(`  ${path}`)
    return 1
  }

  return 0
}

function report(plan: RenamePlan, scope: Scope, citations: number): void {
  logInfo(`Scope ${scope}.`)
  logInfo(
    `${plural(plan.entries.length, 'file')} to change, ${plural(plan.renamed, 'occurrence')} to rewrite.`,
  )
  logInfo(`${plural(plan.moves, 'path')} to move.`)
  logInfo(
    `${plural(plan.protectedCount, 'occurrence')} protected and left alone.`,
  )

  if (plan.excluded.length > 0) {
    logInfo(`Excluded: ${plan.excluded.join(', ')}.`)
  }

  if (citations > 0) {
    logWarn(
      `${plural(citations, 'file')} outside toolkit-owned folders still cite the old name. They are yours to change.`,
    )
  }
}

function toRecord(
  plan: RenamePlan,
  scope: Scope,
  citations: number,
  wrote: boolean | undefined,
): unknown {
  return {
    scope,
    wrote: wrote === true,
    files: plan.entries.length,
    renamed: plan.renamed,
    moves: plan.moves,
    protected: plan.protectedCount,
    excluded: plan.excluded,
    citations,
    paths: plan.entries.map((entry) => ({
      path: entry.path,
      ...(entry.movesTo === undefined ? {} : { movesTo: entry.movesTo }),
      renamed: entry.renamed,
    })),
  }
}

interface RecordsOptions {
  readonly json?: boolean
  readonly write?: boolean
  readonly root?: string
}

/**
 * Moves a project's session records to `.canon/` and repoints what cites them.
 *
 * The ignore gate runs before anything is planned. Every folder being moved is
 * ignored where it stands, so landing them under a root the project does not
 * ignore publishes the memory pen into the next commit, and reporting a plan
 * the caller cannot safely apply is worse than refusing to draw one.
 */
async function runRecords(opts: RecordsOptions): Promise<number> {
  const root = opts.root ?? process.cwd()

  const gitignore = readGitignore(root)
  if (gitignore === undefined) {
    logError(
      `No .gitignore at ${root}, so the records cannot be moved somewhere they stay ignored.`,
    )
    return 1
  }

  if (!ignoresDestination(gitignore)) {
    logError(
      'This project does not ignore .canon/, and every record folder being moved is ignored where it stands.',
    )
    logError(
      'Run canon tooling sync --write to take the ignore entry, then run this again.',
    )
    return 1
  }

  const files = await listRepositoryFiles(root)
  if (files === undefined) {
    logError(`Could not list files under ${root}. Is it a git repository?`)
    return 1
  }

  const plan = planRecordsMove(root, await readSources(root, files))

  // stdout, so the record pipes clean. `pipeOutput` frames to stderr, which is
  // where this command's report belongs and where a JSON record does not.
  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify(toRecordsRecord(plan, opts.write))}\n`,
    )
  }

  reportRecords(plan)

  if (plan.collisions.length > 0) {
    logError(
      `${plural(plan.collisions.length, 'destination')} already exist under .canon/. Merging two record folders is not a call this verb takes.`,
    )
    for (const path of plan.collisions) logError(`  ${path}`)
    return 1
  }

  if (plan.moves.length === 0 && plan.entries.length === 0) return 0

  if (!opts.write) {
    logWarn('Nothing was written. Pass --write to apply this plan.')
    return 2
  }

  const applied = await applyRecordsMove(root, plan)
  logStep(
    `Rewrote ${plural(applied.written, 'file')} and moved ${plural(applied.moved, 'folder')}.`,
  )

  // `failed` carries a citation the write loop could not land as well as a
  // folder the rename loop stopped on, so the line names a path rather than a
  // folder. Reading a rejected write back as a folder that would not move sends
  // the reader looking at the wrong half of the verb.
  if (applied.failed.length > 0) {
    logError(`Could not write ${plural(applied.failed.length, 'path')}.`)
    for (const path of applied.failed) logError(`  ${path}`)
    return 1
  }

  return 0
}

function readGitignore(root: string): string | undefined {
  try {
    return readFileSync(join(root, '.gitignore'), 'utf8')
  } catch {
    return undefined
  }
}

function reportRecords(plan: RecordsPlan): void {
  logInfo(`${plural(plan.moves.length, 'folder')} to move.`)
  for (const move of plan.moves) logInfo(`  ${move.from} -> ${move.to}`)
  logInfo(
    `${plural(plan.entries.length, 'file')} to change, ${plural(plan.rewritten, 'citation')} to rewrite.`,
  )
  logInfo(`${plural(plan.kept, 'citation')} marked to keep the old root.`)

  if (plan.excluded.length > 0) {
    logInfo(`${plural(plan.excluded.length, 'file')} excluded from the sweep.`)
  }
}

function toRecordsRecord(
  plan: RecordsPlan,
  wrote: boolean | undefined,
): unknown {
  return {
    ok: plan.collisions.length === 0,
    wrote: wrote === true,
    moves: plan.moves,
    collisions: plan.collisions,
    files: plan.entries.length,
    rewritten: plan.rewritten,
    kept: plan.kept,
    excluded: plan.excluded.length,
    paths: plan.entries.map((entry) => ({
      path: entry.path,
      rewritten: entry.rewritten,
    })),
  }
}

export function register(program: Command): void {
  const migrate = program
    .command('migrate')
    .description('Move a project off a retired name or layout')
    .helpOption('-h, --help', 'Show this help message')

  migrate
    .command('records')
    .description('Move the gitignored session records to .canon/')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--write', 'Apply the plan rather than reporting it')
    .option(
      '--root <path>',
      'Project root, defaulting to the working directory',
    )
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  nothing to move, or --write applied the whole plan',
        '  1  refused, or a move failed',
        '  2  a plan exists and --write was not passed',
        '',
        'The project has to ignore .canon/ before anything moves. Every folder',
        'this relocates is ignored where it stands, and landing one under a root',
        'the project tracks publishes the memory pen into the next commit.',
        '',
        'A line carrying canon-keep-record-root, or the line below it, keeps the',
        'old root. Prose that dates a decision needs it; a live path does not.',
        '',
        'Examples:',
        '  canon migrate records',
        '  canon migrate records --write',
        '  canon migrate records --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: RecordsOptions) => {
      process.exitCode = await runRecords(opts)
    })

  migrate
    .command('rename')
    .description('Rewrite every unprotected aitk token to canon')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--write', 'Apply the plan rather than reporting it')
    .option(
      '--root <path>',
      'Project root, defaulting to the working directory',
    )
    .option('--scope <scope>', `What to rewrite: ${SCOPES.join(', ')}`, 'self')
    .addHelpText(
      'after',
      [
        '',
        'Scopes:',
        '  self    every tracked file, for the toolkit repository itself',
        '  target  toolkit-owned folders only, reporting the rest as citations',
        '',
        'Exit codes:',
        '  0  nothing to rewrite, or --write applied the whole plan',
        '  1  refused, or a move failed',
        '  2  a plan exists and --write was not passed',
        '',
        'The changelog is never rewritten. Its entries record what shipped',
        'under the old name, and GitHub redirects the links they carry.',
        'aitk-sandbox is a separate repository and is left alone.',
        '',
        'Examples:',
        '  canon migrate rename',
        '  canon migrate rename --write',
        '  canon migrate rename --scope target --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: RenameOptions) => {
      process.exitCode = await runRename(opts)
    })
}
