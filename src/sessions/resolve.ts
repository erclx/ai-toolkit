import { $ } from 'bun'
import { gitEnv } from '@/git-env'
import {
  type Confidence,
  liveness,
  type LivenessProbes,
  SYSTEM_PROBES,
} from '@/sessions/live'
import { readRegistry, type SessionRecord } from '@/sessions/registry'

/** Why a row carries no branch, stated rather than left as an absent key. */
export type Unresolved =
  | 'not-a-repository'
  | 'detached-head'
  | 'git-unavailable'

export interface ResolvedSession {
  readonly name: string
  readonly pid: number
  readonly sessionId: string | null
  readonly cwd: string
  readonly kind: string
  readonly status: string
  readonly startedAt: string | null
  /**
   * The shared git directory every worktree of one repository resolves to,
   * which is what identifies the repository a row belongs to. A branch name is
   * unique inside one and says nothing across a machine.
   */
  readonly repository: string | null
  readonly worktree: string | null
  readonly branch: string | null
  /** Null exactly when `branch` is set. The two are written together. */
  readonly unresolved: Unresolved | null
}

export type SessionReport =
  | { readonly kind: 'absent'; readonly dir: string }
  | {
      readonly kind: 'resolved'
      readonly dir: string
      /**
       * The weakest confidence any surviving row was decided at, so one read
       * tells a caller whether the roster can be trusted as an identity.
       */
      readonly confidence: Confidence
      readonly sessions: readonly ResolvedSession[]
    }

export interface ResolveOptions {
  readonly dir?: string
  readonly probes?: LivenessProbes
  readonly locate?: (cwd: string) => Promise<Located>
}

export interface Located {
  readonly repository: string | null
  readonly worktree: string | null
  readonly branch: string | null
  readonly unresolved: Unresolved | null
}

/**
 * Asks git what a directory is checked out to.
 *
 * A detached HEAD and a directory outside any repository are separated here
 * rather than collapsed into one empty answer, because the first is a session
 * that has a worktree and no branch and the second has neither.
 */
async function locate(cwd: string): Promise<Located> {
  const top = await $`git -C ${cwd} rev-parse --show-toplevel`
    .env(gitEnv())
    .quiet()
    .nothrow()

  if (top.exitCode !== 0) {
    // git absent and git refusing the directory are both non-zero here. The
    // first is the platform report the plan asked for and the second is an
    // ordinary answer, so the distinguishing read is whether git ran at all.
    const version = await $`git --version`.quiet().nothrow()
    return {
      repository: null,
      worktree: null,
      branch: null,
      unresolved:
        version.exitCode === 0 ? 'not-a-repository' : 'git-unavailable',
    }
  }

  const worktree = top.stdout.toString().trim()
  const repository = await repositoryOf(cwd)
  const head = await $`git -C ${cwd} branch --show-current`
    .env(gitEnv())
    .quiet()
    .nothrow()
  const branch = head.stdout.toString().trim()

  if (head.exitCode !== 0 || branch.length === 0) {
    return { repository, worktree, branch: null, unresolved: 'detached-head' }
  }

  return { repository, worktree, branch, unresolved: null }
}

/**
 * Resolves the shared git directory a working directory belongs to.
 *
 * The common directory is what a linked worktree and its main checkout agree
 * on, so two rows in one repository match here while the toplevel would place
 * every worktree in a repository of its own.
 */
export async function repositoryOf(cwd: string): Promise<string | null> {
  const dir =
    await $`git -C ${cwd} rev-parse --path-format=absolute --git-common-dir`
      .env(gitEnv())
      .quiet()
      .nothrow()

  if (dir.exitCode !== 0) return null

  const resolved = dir.stdout.toString().trim()
  return resolved.length > 0 ? resolved : null
}

/**
 * An absent field is rendered as an absence rather than as a value.
 *
 * A missing start time formatted from zero reads as a session launched in 1970
 * and a missing identifier as an empty one, both of which a caller would take
 * for data. Null says the record did not carry it, which is the same
 * distinction the registry draws between an absent folder and an empty one.
 */
function present(record: SessionRecord, located: Located): ResolvedSession {
  return {
    name: record.name,
    pid: record.pid,
    sessionId: record.sessionId ?? null,
    cwd: record.cwd,
    kind: record.kind ?? 'unknown',
    status: record.status ?? 'unknown',
    startedAt:
      record.startedAt === undefined
        ? null
        : new Date(record.startedAt).toISOString(),
    repository: located.repository,
    worktree: located.worktree,
    branch: located.branch,
    unresolved: located.unresolved,
  }
}

/**
 * Resolves every live session to the worktree and branch it holds.
 *
 * The registry is the whole source. Each session writes its own working
 * directory beside its own name, so a caller matching a listing row to a branch
 * reads both from one record instead of ordering the roster by start time and
 * hoping the order holds.
 *
 * A row whose branch cannot be read is kept and marked. Dropping it would leave
 * a caller unable to tell a session that holds no branch from one the resolver
 * never saw, and the second is the failure this replaces.
 */
export async function resolveSessions(
  opts: ResolveOptions = {},
): Promise<SessionReport> {
  const probes = opts.probes ?? SYSTEM_PROBES
  const find = opts.locate ?? locate
  const registry = readRegistry(opts.dir)

  if (registry.kind === 'absent') return { kind: 'absent', dir: registry.dir }

  const live: SessionRecord[] = []
  let confidence: Confidence = 'confirmed'

  for (const record of registry.records) {
    const state = liveness(record, probes)
    if (!state.alive) continue
    if (state.confidence === 'unverified') confidence = 'unverified'
    live.push(record)
  }

  const sessions = await Promise.all(
    live.map(async (record) => present(record, await find(record.cwd))),
  )

  return { kind: 'resolved', dir: registry.dir, confidence, sessions }
}
