import type { Command } from 'commander'
import {
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
    .option('--branch <name>', 'Report only the sessions holding this branch')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the roster was read',
        '  1  refused, with the reason on stderr',
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

  const shown = opts.branch
    ? report.sessions.filter((session) => session.branch === opts.branch)
    : report.sessions

  intro('aitk sessions list')
  reportConfidence(report)
  reportSessions(shown, opts.branch)
  outro()

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        dir: report.dir,
        confidence: report.confidence,
        branch: opts.branch ?? null,
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
): void {
  logStep('Sessions')

  if (sessions.length === 0) {
    logInfo(
      branch
        ? `No live session holds ${branch}.`
        : 'No live session. Every record in the registry belongs to a session that has ended.',
    )
    return
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
