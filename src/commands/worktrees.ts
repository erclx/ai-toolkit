import type { Command } from 'commander'
import {
  intro,
  logInfo,
  logRemove,
  logStep,
  logWarn,
  outro,
  pipeOutput,
  plural,
} from '@/ui'
import {
  type Refusal,
  type ReclaimReport,
  reclaimReport,
  type Unreadable,
  type WorktreeVerdict,
} from '@/worktrees/reclaim'
import { mainWorktreeRoot } from '@/worktree'
import { removeReclaimable, type RemovalOutcome } from '@/worktrees/remove'

interface ListCommandOptions {
  readonly json?: boolean
}

interface ReclaimCommandOptions {
  readonly dryRun?: boolean
}

const REFUSALS: Record<Refusal, string> = {
  'main-worktree': 'the main worktree, which is never reclaimable',
  'current-worktree':
    'the worktree this command is running in, so removing it would take the run with it',
  'detached-head': 'detached HEAD, so no branch names a pull request',
  'no-merged-pull-request': 'no merged pull request for its branch',
  'uncommitted-changes': 'uncommitted work no history stands behind',
  'unreadable-worktree': 'the working tree could not be read',
  'held-by-session': 'a live session still holds it',
}

const UNREADABLE: Record<Unreadable, string> = {
  'gh-missing':
    'gh is not on the path, so the merge state could not be read. Install it and run this again.',
  'gh-failed':
    'The pull request read failed, so every worktree would report as unmerged whatever its real state. Authenticate gh and run this again.',
  'sessions-unreadable':
    'The session roster could not be read, so nothing was read about which worktrees are still held.',
}

const CONDITIONS = [
  'A worktree is reclaimable when all three hold: its branch has a merged',
  'pull request, its working tree is clean, and no live session holds it.',
  'Each alone has a case where removal loses something, so "refusals"',
  'carries every failing condition rather than the first.',
  '',
  'The merged state comes from gh rather than from git ancestry. A',
  'repository that squash merges never makes a merged branch an ancestor',
  'of its trunk, so ancestry calls shipped work unmerged and calls an',
  'abandoned branch sitting at a release commit merged.',
  '',
  'A directory already deleted by hand reads as clean rather than as',
  'unreadable, so the merged and session checks decide it like any other.',
  '',
  'The main worktree is never reclaimable, and neither is the one this',
  'command is running in, since git removes the directory a caller stands',
  'in and every later call scoped to it then fails.',
  '',
  'An unreadable input refuses the whole reading rather than reporting',
  'every worktree as not reclaimable, since an absent merge state and a',
  'branch with no merged pull request produce the same empty answer.',
  '',
  'The merge read covers the most recent 200 merged pull requests. A',
  'worktree older than that reads as having none and is refused, which',
  'keeps a directory rather than removing one.',
]

export function register(program: Command): void {
  const worktrees = program
    .command('worktrees')
    .description('Report which worktrees are reclaimable, and reclaim them')
    .helpOption('-h, --help', 'Show this help message')

  worktrees
    .command('list')
    .description(
      'Report every worktree with a reclaim verdict and the reason behind it',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  every worktree was read',
        '  1  refused, with the reason on stderr',
        '',
        ...CONDITIONS,
        '',
        'This reports and removes nothing. "route" names which removal shape',
        'applies: "session" when a live session holds the directory, where',
        '`claude rm <name>` takes the session and its worktree together, and',
        '"worktree" when the session has ended, where `canon worktrees',
        'reclaim` is the pair of a remove and a branch delete.',
        '',
        'Examples:',
        '  canon worktrees list',
        '  canon worktrees list --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: ListCommandOptions) => {
      process.exitCode = await runList(opts)
    })

  worktrees
    .command('reclaim')
    .description(
      'Remove every reclaimable worktree and the branch behind it, unless --dry-run',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--dry-run', 'Report what would be removed without removing it')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  every reclaimable worktree was removed, or there were none',
        '  1  refused, or a removal failed, with the reason on stderr',
        '',
        ...CONDITIONS,
        '',
        'Removal runs on the default path rather than behind an apply flag,',
        'because report-only is what produced the hand cleanup this verb was',
        'filed against. Each removal unlocks the worktree, removes it, then',
        'deletes its branch, and a run carrying a directory that is already',
        'gone sweeps stale registrations once before the branch deletes.',
        '',
        'It deletes only what a reading called reclaimable. A worktree a live',
        'session holds is refused rather than removed, since `claude rm <name>`',
        'is what takes a session and its worktree together.',
        '',
        'The stale-registration sweep is the one step that reaches wider, since',
        'git takes no path to scope it. It clears the bookkeeping for every',
        'directory already gone, refused entries included, and deletes no branch',
        'and no directory of its own.',
        '',
        'Examples:',
        '  canon worktrees reclaim --dry-run',
        '  canon worktrees reclaim',
        '',
      ].join('\n'),
    )
    .action(async (opts: ReclaimCommandOptions) => {
      process.exitCode = await runReclaim(opts)
    })
}

/**
 * Frames an unreadable reading the same way for both verbs.
 *
 * The merge state is the one input that decides whether a branch is safe to
 * delete, so a reading that could not reach it refuses every entry rather than
 * falling back to a default. Sharing the frame keeps the removal from growing a
 * second answer to the question the report already answers.
 */
function reportUnreadable(
  report: Extract<ReclaimReport, { kind: 'unreadable' }>,
): void {
  logStep('Refused')
  logWarn(UNREADABLE[report.reason])
  logInfo(report.detail)
}

async function runList(opts: ListCommandOptions): Promise<number> {
  const report = await reclaimReport({ cwd: process.cwd() })

  intro('canon worktrees list')

  if (report.kind === 'unreadable') {
    reportUnreadable(report)
    outro()

    if (opts.json) {
      process.stdout.write(
        `${JSON.stringify({
          reason: report.reason,
          detail: report.detail,
          worktrees: [],
        })}\n`,
      )
    }

    return 1
  }

  reportWorktrees(report.worktrees)
  outro()

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        reason: null,
        detail: null,
        worktrees: report.worktrees,
      })}\n`,
    )
  }

  return 0
}

async function runReclaim(opts: ReclaimCommandOptions): Promise<number> {
  const dryRun = opts.dryRun ?? false
  const cwd = process.cwd()
  const report = await reclaimReport({ cwd })

  intro(
    dryRun ? 'canon worktrees reclaim (dry-run)' : 'canon worktrees reclaim',
  )

  if (report.kind === 'unreadable') {
    reportUnreadable(report)
    outro()
    return 1
  }

  const reclaimable = report.worktrees.filter((entry) => entry.reclaimable)

  logStep('Reclaimable')
  if (reclaimable.length === 0) {
    logInfo('None. Every worktree fails at least one condition.')
    outro()
    return 0
  }

  logInfo(plural(reclaimable.length, 'worktree'))
  pipeOutput(reclaimable.map(describe).join('\n'))

  if (dryRun) {
    logStep('Dry run')
    logWarn('Nothing was removed. Run this again without --dry-run to remove.')
    outro()
    return 0
  }

  // Every git call in the removal is scoped to the main root rather than to the
  // caller's directory, which a removal earlier in the same run can delete out
  // from under the ones after it. The reading above stays on the caller's
  // directory, since that is what tells it which worktree it is standing in.
  const removal = await removeReclaimable(reclaimable, {
    cwd: await mainWorktreeRoot(),
  })

  logStep('Removed')
  for (const outcome of removal.outcomes) reportOutcome(outcome)
  if (removal.pruned) {
    logInfo(
      'Swept the stale worktree registrations left by a deleted directory.',
    )
  }

  const failed = removal.outcomes.filter((outcome) => !outcome.removed)
  if (failed.length > 0) {
    logWarn(
      `${plural(failed.length, 'worktree')} could not be removed. Read the reason above and clear it by hand.`,
    )
    outro()
    return 1
  }

  outro()
  return 0
}

/** Names what happened to one entry, with the failing step where it did not close. */
function reportOutcome(outcome: RemovalOutcome): void {
  const branch = outcome.branch ?? 'detached'

  if (outcome.removed) {
    logRemove(`${outcome.path}  ${branch}`)
    return
  }

  const step =
    outcome.failedAt === 'branch'
      ? 'the worktree went but its branch stayed'
      : 'the worktree could not be removed'
  logWarn(`${outcome.path}  ${branch}: ${step}.`)
  if (outcome.detail) pipeOutput(outcome.detail)
}

function reportWorktrees(worktrees: readonly WorktreeVerdict[]): void {
  logStep('Worktrees')

  if (worktrees.length === 0) {
    logInfo('No worktree resolved here. Run this inside a repository.')
    return
  }

  logInfo(plural(worktrees.length, 'worktree'))
  pipeOutput(worktrees.map(describe).join('\n'))

  const reclaimable = worktrees.filter((entry) => entry.reclaimable)

  logStep('Reclaimable')
  if (reclaimable.length === 0) {
    logInfo('None. Every worktree fails at least one condition.')
    return
  }

  logWarn(
    `${plural(reclaimable.length, 'worktree')} can be reclaimed. This reports and removes nothing, so run \`canon worktrees reclaim\` to clear them.`,
  )
}

/**
 * Names the evidence beside the conclusion on every row.
 *
 * The reading has two consumers and they act on different halves. The sweep
 * reads the verdict to decide what to offer, and a person reads it to decide
 * what to remove, so a row phrased for the first alone leaves the second
 * removing a directory on a conclusion it cannot check.
 */
function describe(verdict: WorktreeVerdict): string {
  const held = verdict.branch ?? 'detached'
  const head = `${verdict.path}  ${held}`

  if (!verdict.reclaimable) {
    const reasons = verdict.refusals.map((refusal) => REFUSALS[refusal])
    // A name is quoted because a session carries whatever string it was
    // launched under, spaces included, and one command per name because a
    // joined list reads as a single argument.
    const routes =
      verdict.route === 'session'
        ? verdict.sessions.map(
            (name) => `\n  Removal there goes through: claude rm '${name}'`,
          )
        : []
    return `${head}\n  Refused: ${reasons.join('; ')}.${routes.join('')}`
  }

  // The directory being gone already is the state that used to refuse, so the
  // row says so rather than leaving a reader to wonder what it is acting on.
  const tree = verdict.missing
    ? 'its directory is already gone'
    : 'the tree is clean'

  return [
    head,
    `  Reclaimable. Pull request #${verdict.pullRequest} merged it, ${tree}, and no session holds it.`,
  ].join('\n')
}
