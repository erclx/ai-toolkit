import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { LivenessProbes } from '@/sessions/live'
import { type Located, resolveSessions } from '@/sessions/resolve'

let DIR: string

beforeEach(() => {
  DIR = mkdtempSync(join(tmpdir(), 'aitk-resolve-'))
})

afterEach(() => {
  rmSync(DIR, { recursive: true, force: true })
})

function seed(pid: number, fields: Record<string, unknown> = {}): void {
  writeFileSync(
    join(DIR, `${pid}.json`),
    JSON.stringify({
      pid,
      sessionId: `id-${pid}`,
      cwd: `/repo/worktrees/w${pid}`,
      name: `aitk-${pid}`,
      kind: 'interactive',
      status: 'idle',
      startedAt: pid,
      procStart: String(pid * 10),
      ...fields,
    }),
  )
}

/** Every seeded pid confirmed live, which is the ordinary machine. */
const ALIVE: LivenessProbes = {
  procStartOf: (pid) => String(pid * 10),
  responds: () => true,
}

/** No process filesystem, which is the platform the fallback exists for. */
const NO_PROC: LivenessProbes = {
  procStartOf: () => null,
  responds: () => true,
}

function locating(branch: string | null): (cwd: string) => Promise<Located> {
  return async (cwd) =>
    branch === null
      ? { worktree: cwd, branch: null, unresolved: 'detached-head' }
      : { worktree: cwd, branch, unresolved: null }
}

describe('resolveSessions', () => {
  it('should pass an absent registry through rather than reporting no sessions', async () => {
    const report = await resolveSessions({ dir: join(DIR, 'nowhere') })

    expect(report.kind).toBe('absent')
  })

  it('should name the branch each live session holds', async () => {
    seed(100)

    const report = await resolveSessions({
      dir: DIR,
      probes: ALIVE,
      locate: locating('feat/parser'),
    })

    expect(report.kind === 'resolved' && report.sessions[0]).toMatchObject({
      name: 'aitk-100',
      branch: 'feat/parser',
      unresolved: null,
    })
  })

  it('should drop a record whose session has ended', async () => {
    seed(100)
    seed(200)

    const report = await resolveSessions({
      dir: DIR,
      probes: {
        procStartOf: (pid) => (pid === 100 ? '1000' : 'reused'),
        responds: () => true,
      },
      locate: locating('feat/parser'),
    })

    expect(
      report.kind === 'resolved' && report.sessions.map((s) => s.pid),
    ).toEqual([100])
  })

  it('should report confirmed confidence where start times were read', async () => {
    seed(100)

    const report = await resolveSessions({
      dir: DIR,
      probes: ALIVE,
      locate: locating('feat/parser'),
    })

    expect(report.kind === 'resolved' && report.confidence).toBe('confirmed')
  })

  it('should report unverified confidence where the process read is unavailable', async () => {
    seed(100)

    const report = await resolveSessions({
      dir: DIR,
      probes: NO_PROC,
      locate: locating('feat/parser'),
    })

    expect(report.kind === 'resolved' && report.confidence).toBe('unverified')
  })

  it('should keep a session whose branch cannot be read and say why', async () => {
    seed(100)

    const report = await resolveSessions({
      dir: DIR,
      probes: ALIVE,
      locate: locating(null),
    })

    expect(report.kind === 'resolved' && report.sessions[0]).toMatchObject({
      branch: null,
      unresolved: 'detached-head',
    })
  })

  it('should carry the working directory each session reported', async () => {
    seed(100)

    const report = await resolveSessions({
      dir: DIR,
      probes: ALIVE,
      locate: locating('feat/parser'),
    })

    expect(report.kind === 'resolved' && report.sessions[0]?.cwd).toBe(
      '/repo/worktrees/w100',
    )
  })

  it('should report no live session on a registry holding only ended ones', async () => {
    seed(100)

    const report = await resolveSessions({
      dir: DIR,
      probes: { procStartOf: () => 'other', responds: () => false },
      locate: locating('feat/parser'),
    })

    expect(report.kind === 'resolved' && report.sessions).toHaveLength(0)
  })
})
