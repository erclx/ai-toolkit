import type { Command } from 'commander'
import {
  intro,
  logInfo,
  logStep,
  logWarn,
  outro,
  pipeOutput,
  plural,
} from '@/ui'
import {
  type Refusal,
  reclaimReport,
  type Unreadable,
  type WorktreeVerdict,
} from '@/worktrees/reclaim'

interface ListCommandOptions {
  readonly json?: boolean
}

const REFUSALS: Record<Refusal, string> = {
  'main-worktree': 'the main worktree, which is never reclaimable',
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

export function register(program: Command): void {
  const worktrees = program
    .command('worktrees')
    .description('Report which worktrees are reclaimable and which are not')
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
        'This reports and removes nothing. "route" names which removal shape',
        'applies: "session" when a live session holds the directory, where',
        '`claude rm <name>` takes the session and its worktree together, and',
        '"worktree" when the session has ended, where `git worktree remove`',
        'and a branch delete are the pair.',
        '',
        'An unreadable input refuses the whole reading rather than reporting',
        'every worktree as not reclaimable, since an absent merge state and a',
        'branch with no merged pull request produce the same empty answer.',
        '',
        'The merge read covers the most recent 200 merged pull requests. A',
        'worktree older than that reads as having none and is refused, which',
        'keeps a directory rather than removing one.',
        '',
        'Examples:',
        '  aitk worktrees list',
        '  aitk worktrees list --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: ListCommandOptions) => {
      process.exitCode = await runList(opts)
    })
}

async function runList(opts: ListCommandOptions): Promise<number> {
  const report = await reclaimReport({ cwd: process.cwd() })

  intro('aitk worktrees list')

  if (report.kind === 'unreadable') {
    logStep('Refused')
    logWarn(UNREADABLE[report.reason])
    logInfo(report.detail)
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
    `${plural(reclaimable.length, 'worktree')} can be reclaimed. This reports and removes nothing, so run the named command yourself.`,
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

  return [
    head,
    `  Reclaimable. Pull request #${verdict.pullRequest} merged it, the tree is clean, and no session holds it.`,
    `  Remove with: git worktree remove ${verdict.path} && git branch -D ${held}`,
  ].join('\n')
}
