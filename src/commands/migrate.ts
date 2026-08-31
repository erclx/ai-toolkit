import type { Command } from 'commander'
import { listRepositoryFiles } from '@/git-files'
import { applyRename, readSources } from '@/migrate/apply'
import { isToolkitOwned, planRename, type RenamePlan } from '@/migrate/plan'
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
 * Reports rather than writes without `--write`, matching `aitk records
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

export function register(program: Command): void {
  const migrate = program
    .command('migrate')
    .description('Move a project off the retired aitk name')
    .helpOption('-h, --help', 'Show this help message')

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
        '  aitk migrate rename',
        '  aitk migrate rename --write',
        '  aitk migrate rename --scope target --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: RenameOptions) => {
      process.exitCode = await runRename(opts)
    })
}
