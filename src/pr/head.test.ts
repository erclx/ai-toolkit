import { describe, expect, it } from 'vitest'
import { resolveHead, resolveTip } from '@/pr/head'

/** One `git ls-remote` line, tab-separated the way the command writes it. */
function line(sha: string, ref: string): string {
  return `${sha}\t${ref}\n`
}

const TIP = 'a0cf1a39aa1d0d510e16360e98a18129a8fddc78'
const PRIOR = '5653721cbb1d0d510e16360e98a18129a8fddc78'

describe('resolveTip', () => {
  it('should report the sha the remote carries for the branch', async () => {
    const reading = await resolveTip('feat/x', async () =>
      line(TIP, 'refs/heads/feat/x'),
    )

    expect(reading).toEqual({ kind: 'read', tip: TIP })
  })

  it('should refuse when the ref read itself failed', async () => {
    const reading = await resolveTip('feat/x', async () => null)

    expect(reading).toEqual({ kind: 'refused', reason: 'unresolvable-ref' })
  })

  it('should refuse when the remote carries no branch by that name', async () => {
    const reading = await resolveTip('feat/x', async () => '')

    expect(reading).toEqual({ kind: 'refused', reason: 'no-remote-branch' })
  })

  it('should ignore a ref that only ends with the branch name', async () => {
    const reading = await resolveTip(
      'x',
      async () => line(PRIOR, 'refs/heads/feat/x') + line(TIP, 'refs/heads/x'),
    )

    expect(reading).toEqual({ kind: 'read', tip: TIP })
  })
})

describe('resolveHead', () => {
  it('should read fresh when the object head is the branch tip', async () => {
    const reading = await resolveHead('feat/x', TIP, async () =>
      line(TIP, 'refs/heads/feat/x'),
    )

    expect(reading).toEqual({
      kind: 'read',
      state: 'fresh',
      branch: 'feat/x',
      tip: TIP,
      object: TIP,
    })
  })

  it('should read stale when the object head trails the branch tip', async () => {
    const reading = await resolveHead('feat/x', PRIOR, async () =>
      line(TIP, 'refs/heads/feat/x'),
    )

    expect(reading).toEqual({
      kind: 'read',
      state: 'stale',
      branch: 'feat/x',
      tip: TIP,
      object: PRIOR,
    })
  })

  it('should refuse when the ref read failed rather than reading it as fresh', async () => {
    const reading = await resolveHead('feat/x', TIP, async () => null)

    expect(reading).toEqual({
      kind: 'refused',
      reason: 'unresolvable-ref',
      branch: 'feat/x',
    })
  })

  it('should refuse when the remote carries no branch by that name', async () => {
    const reading = await resolveHead('feat/x', TIP, async () => '')

    expect(reading).toEqual({
      kind: 'refused',
      reason: 'no-remote-branch',
      branch: 'feat/x',
    })
  })

  it('should refuse when the pull request object reported no head', async () => {
    const reading = await resolveHead('feat/x', undefined, async () =>
      line(TIP, 'refs/heads/feat/x'),
    )

    expect(reading).toEqual({
      kind: 'refused',
      reason: 'no-object-head',
      branch: 'feat/x',
    })
  })
})
