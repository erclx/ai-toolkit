import {
  repositoryOf,
  resolveSessions,
  type ResolvedSession,
  type SessionReport,
} from '@/sessions/resolve'
import { listWorktrees, type WorktreeEntry } from '@/worktree'

export interface ClaimReport {
  readonly claimed: boolean
  readonly worktree: string | null
  readonly sessions: readonly ResolvedSession[]
}

export interface ClaimOptions {
  readonly cwd?: string
  readonly resolve?: () => Promise<SessionReport>
  readonly listWorktrees?: (cwd: string) => Promise<readonly WorktreeEntry[]>
}

/**
 * Answers whether a branch is already claimed, composing the two readings
 * neither surface can answer alone: a worktree can outlive the session that
 * made it, and a session can hold a branch before a worktree exists for it.
 */
export async function checkClaim(
  branch: string,
  opts: ClaimOptions = {},
): Promise<ClaimReport> {
  const cwd = opts.cwd ?? process.cwd()
  const resolve = opts.resolve ?? resolveSessions
  const listAll = opts.listWorktrees ?? listWorktrees

  const [repository, worktrees, report] = await Promise.all([
    repositoryOf(cwd),
    listAll(cwd),
    resolve(),
  ])

  const worktree =
    worktrees.find((entry) => entry.branch === branch)?.path ?? null

  const sessions =
    report.kind === 'resolved'
      ? report.sessions.filter(
          (session) =>
            session.branch === branch && session.repository === repository,
        )
      : []

  return {
    claimed: worktree !== null || sessions.length > 0,
    worktree,
    sessions,
  }
}
