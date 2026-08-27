import type { Command } from 'commander'
import { checkClaim, type ClaimReport } from '@/sessions/claim'
import {
  repositoryOf,
  type ResolvedSession,
  resolveSessions,
  type SessionReport,
} from '@/sessions/resolve'
import {
  intro,
  logInfo,
  logStep,
  logWarn,
  outro,
  pipeOutput,
  plural,
} from '@/ui'

interface ListCommandOptions {
  readonly json?: boolean
  readonly branch?: string
}

const REASONS: Record<string, string> = {
  'not-a-repository': 'working outside any git repository',
  'detached-head': 'detached HEAD, so the worktree holds no branch name',
  'git-unavailable': 'git is not on the path, so nothing could be read',
}

export function register(program: Command): void {
  const sessions = program
    .command('sessions')
    .description(
      'Resolve live peer sessions to the worktree and branch each holds',
    )
    .helpOption('-h, --help', 'Show this help message')

  sessions
    .command('list')
    .description(
      'Report every live session with its working directory and branch',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option(
      '--branch <name>',
      'Report only the sessions holding this branch in this repository',
    )
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the roster was read',
        '  1  refused, with the reason on stderr',
        '',
        '--branch scopes the match to the repository the command runs in, since',
        'a branch name identifies a branch there and nothing across a machine.',
        'A bare run reports every repository and carries the repository field,',
        'so a caller filtering by hand has something that identifies one.',
        '',
        'With --branch, the JSON also carries "worktree" (the path of any',
        'worktree already checked out to it, or null) and "claimed" (true when',
        'either a worktree or a live session already holds it). A dispatcher',
        'reads "claimed" rather than composing the two fields itself, since',
        'either one alone can miss a real claim: a worktree can outlive the',
        'session that made it, and a session can hold a branch before a',
        'worktree exists for it.',
        '',
        '"sessionsReadable" is false when the session roster could not be read,',
        'which leaves "claimed" covering the worktree half alone. Treat that',
        'case as unverified rather than as a clean "false".',
        '',
        'The match can return more than one session. Read the count rather than',
        'the first row, since two sessions can hold one branch.',
        '',
        'Each session writes its own working directory beside its own name, so a',
        'name from a session listing joins to a branch by an exact match rather',
        'than by ordering the roster on start time.',
        '',
        'The confidence field says how the liveness of a row was decided.',
        '"confirmed" matched the running process against the start time the',
        'record stamped. "unverified" means only that the pid answers, which',
        'cannot rule out a pid handed to an unrelated process, so a roster',
        'reported that way is a candidate list rather than an identity.',
        '',
        'Examples:',
        '  aitk sessions list',
        '  aitk sessions list --json',
        '  aitk sessions list --branch feat/parser --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: ListCommandOptions) => {
      process.exitCode = await runList(opts)
    })
}

async function runList(opts: ListCommandOptions): Promise<number> {
  const report = await resolveSessions()

  if (report.kind === 'absent') {
    intro('aitk sessions list')
    logStep('Refused')
    logWarn(
      `No session registry at ${report.dir}. Nothing was read, so this is not a machine with no sessions.`,
    )
    outro()

    if (opts.json) {
      process.stdout.write(
        `${JSON.stringify({ dir: report.dir, reason: 'no-registry', sessions: [] })}\n`,
      )
    }

    return 1
  }

  // A branch name identifies a branch inside one repository and nothing across
  // a machine, so an unscoped match reaches a session working in a different
  // project. `main` is the name that collides on every machine running two.
  const repository = opts.branch ? await repositoryOf(process.cwd()) : null

  if (opts.branch && repository === null) {
    intro('aitk sessions list')
    logStep('Refused')
    logWarn(
      '--branch scopes the match to the repository this command runs in, and no repository resolved here. Run it inside one, or read the whole roster and filter on the repository field.',
    )
    outro()

    if (opts.json) {
      process.stdout.write(
        `${JSON.stringify({ dir: report.dir, reason: 'no-repository', sessions: [] })}\n`,
      )
    }

    return 1
  }

  const shown = opts.branch
    ? report.sessions.filter(
        (session) =>
          session.branch === opts.branch && session.repository === repository,
      )
    : report.sessions

  const claim = opts.branch
    ? await checkClaim(opts.branch, {
        cwd: process.cwd(),
        resolve: async () => report,
      })
    : null

  intro('aitk sessions list')
  reportConfidence(report)
  reportSessions(shown, opts.branch, repository)
  if (claim) reportClaim(claim)
  outro()

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        dir: report.dir,
        confidence: report.confidence,
        branch: opts.branch ?? null,
        repository,
        worktree: claim?.worktree ?? null,
        claimed: claim?.claimed ?? null,
        sessionsReadable: claim?.sessionsReadable ?? null,
        sessions: shown,
      })}\n`,
    )
  }

  return 0
}

/**
 * States how liveness was decided on every run, including the run that decided
 * it the strong way.
 *
 * A caller reading a roster has no other way to tell a confirmed identity from
 * a pid that merely answered, and the two support different actions: the first
 * addresses a session directly and the second opens by asking to be corrected.
 */
function reportConfidence(
  report: Extract<SessionReport, { kind: 'resolved' }>,
): void {
  logStep('Liveness')

  // A roster of none decided nothing, so the confirmed line would claim a check
  // over rows that do not exist. The registry is never pruned and holds a record
  // per session ever run, which is what makes the empty result worth stating.
  if (report.sessions.length === 0) {
    logInfo(
      'No row to decide. Every record belongs to a session that has ended.',
    )
    return
  }

  if (report.confidence === 'confirmed') {
    logInfo(
      'Every row matched a running process against the start time its record stamped.',
    )
    return
  }

  logWarn(
    'Start times could not be read, so rows rest on a pid answering alone. Treat the mapping as inferred and open by asking to be corrected.',
  )
}

function reportSessions(
  sessions: readonly ResolvedSession[],
  branch: string | undefined,
  repository: string | null,
): void {
  logStep('Sessions')

  if (branch) {
    logInfo(
      `Scoped to ${repository}, since a branch name identifies one there.`,
    )
  }

  if (sessions.length === 0) {
    logInfo(
      branch
        ? `No live session in this repository holds ${branch}.`
        : 'No live session. Every record in the registry belongs to a session that has ended.',
    )
    return
  }

  // The count is what a dispatch turns on. One row is a target and several are
  // candidates, and the caller cannot tell them apart from a roster alone.
  if (branch && sessions.length > 1) {
    logWarn(
      `${sessions.length} sessions hold ${branch}. Confirm which one before addressing it.`,
    )
  }

  logInfo(plural(sessions.length, 'live session'))
  pipeOutput(
    sessions
      .map((session) => {
        const held =
          session.branch ??
          `unresolved: ${REASONS[session.unresolved ?? ''] ?? 'unknown'}`
        return `${session.name}  ${session.status}  ${held}\n  ${session.cwd}`
      })
      .join('\n'),
  )
}

function reportClaim(claim: ClaimReport): void {
  logStep('Claim')

  if (claim.worktree) {
    logInfo(`Worktree: ${claim.worktree}`)
  }

  logInfo(claim.claimed ? 'Claimed.' : 'Unclaimed.')

  if (!claim.sessionsReadable) {
    logWarn(
      'The session roster could not be read, so this reads the worktree listing alone. Treat the session half as unverified rather than clear.',
    )
  }
}
