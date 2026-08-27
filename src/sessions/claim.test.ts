import { execaSync } from 'execa'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { gitEnv } from '@/git-env'
import { checkClaim } from '@/sessions/claim'
import { repositoryOf, type ResolvedSession } from '@/sessions/resolve'

let ROOT: string

function git(...args: string[]): string {
  return execaSync('git', ['-C', ROOT, ...args], {
    env: gitEnv(),
    extendEnv: false,
  }).stdout
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-claim-'))
  git('init', '--quiet', '--initial-branch=main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('commit', '--quiet', '--allow-empty', '-m', 'init')
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

function session(fields: Partial<ResolvedSession>): ResolvedSession {
  return {
    name: 'aitk-1',
    pid: 1,
    sessionId: 'id-1',
    cwd: '/repo/worktrees/w1',
    kind: 'interactive',
    status: 'idle',
    startedAt: null,
    repository: null,
    worktree: null,
    branch: null,
    unresolved: null,
    ...fields,
  }
}

describe('checkClaim', () => {
  it('should report an unclaimed branch when neither surface holds it', async () => {
    const report = await checkClaim('feat/parser', {
      cwd: ROOT,
      resolve: async () => ({
        kind: 'resolved',
        dir: '/registry',
        confidence: 'confirmed',
        sessions: [],
      }),
    })

    expect(report).toEqual({
      claimed: false,
      worktree: null,
      sessions: [],
      sessionsReadable: true,
    })
  })

  it('should report a branch claimed by an existing worktree', async () => {
    git('worktree', 'add', '--quiet', '-b', 'feat/parser', 'wt-linked')

    const report = await checkClaim('feat/parser', {
      cwd: ROOT,
      resolve: async () => ({
        kind: 'resolved',
        dir: '/registry',
        confidence: 'confirmed',
        sessions: [],
      }),
    })

    expect(report.claimed).toBe(true)
    expect(report.worktree).toBe(join(ROOT, 'wt-linked'))
  })

  it('should report a branch claimed by a live session with no worktree', async () => {
    const repository = await repositoryOf(ROOT)

    const report = await checkClaim('feat/parser', {
      cwd: ROOT,
      resolve: async () => ({
        kind: 'resolved',
        dir: '/registry',
        confidence: 'confirmed',
        sessions: [session({ branch: 'feat/parser', repository })],
      }),
    })

    expect(report.claimed).toBe(true)
    expect(report.worktree).toBeNull()
    expect(report.sessions).toHaveLength(1)
  })

  it('should not count a session holding the same branch in another repository', async () => {
    const report = await checkClaim('feat/parser', {
      cwd: ROOT,
      resolve: async () => ({
        kind: 'resolved',
        dir: '/registry',
        confidence: 'confirmed',
        sessions: [
          session({ branch: 'feat/parser', repository: '/other/.git' }),
        ],
      }),
    })

    expect(report.claimed).toBe(false)
    expect(report.sessions).toHaveLength(0)
  })

  it('should report the session roster as unreadable when the registry is absent', async () => {
    const report = await checkClaim('feat/parser', {
      cwd: ROOT,
      resolve: async () => ({ kind: 'absent', dir: '/registry' }),
    })

    expect(report).toEqual({
      claimed: false,
      worktree: null,
      sessions: [],
      sessionsReadable: false,
    })
  })

  it('should still report a worktree claim when the session roster is unreadable', async () => {
    git('worktree', 'add', '--quiet', '-b', 'feat/parser', 'wt-linked')

    const report = await checkClaim('feat/parser', {
      cwd: ROOT,
      resolve: async () => ({ kind: 'absent', dir: '/registry' }),
    })

    expect(report.claimed).toBe(true)
    expect(report.sessionsReadable).toBe(false)
  })

  // A git hook exports GIT_DIR into every process it runs, and it takes
  // precedence over `-C`, so a claim read from inside one answered about the
  // hook's own repository rather than the directory it was handed.
  it('should read the directory it was given when the environment names another repository', async () => {
    const other = mkdtempSync(join(tmpdir(), 'aitk-claim-other-'))
    execaSync(
      'git',
      ['-C', other, 'init', '--quiet', '--initial-branch=main'],
      {
        env: gitEnv(),
        extendEnv: false,
      },
    )
    git('worktree', 'add', '--quiet', '-b', 'feat/parser', 'wt-linked')

    process.env.GIT_DIR = join(other, '.git')
    try {
      const report = await checkClaim('feat/parser', {
        cwd: ROOT,
        resolve: async () => ({ kind: 'absent', dir: '/registry' }),
      })

      expect(report.claimed).toBe(true)
    } finally {
      delete process.env.GIT_DIR
      rmSync(other, { recursive: true, force: true })
    }
  })
})
