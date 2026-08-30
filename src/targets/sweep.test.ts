import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { sweepTargets } from '@/targets/sweep'

let ROOT: string

/** Stamps a folder the way a current install leaves it. */
function stamp(...segments: string[]): string {
  const target = join(ROOT, ...segments)
  const path = join(target, '.claude', 'aitk', 'config.json')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify({ covers: [], domains: {} }))
  return target
}

/** Stamps a folder the way an install predating the relocation left it. */
function stampLegacy(...segments: string[]): string {
  const target = join(ROOT, ...segments)
  const path = join(target, '.claude', 'aitk.json')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify({ covers: [], domains: {} }))
  return target
}

const noOrigin = async (): Promise<string | null> => null

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-sweep-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('sweepTargets', () => {
  it('should find a target stamped at the current path', async () => {
    const caret = stamp('caret')

    const report = await sweepTargets([ROOT], { originOf: noOrigin })

    expect(report.targets.map((target) => target.paths)).toEqual([[caret]])
  })

  it('should find a target still stamped at the retired path and mark it', async () => {
    stampLegacy('stackr')

    const report = await sweepTargets([ROOT], { originOf: noOrigin })

    expect(report.targets).toHaveLength(1)
    expect(report.targets[0]?.legacy).toBe(true)
  })

  it('should report a folder carrying no stamp as no target rather than as one', async () => {
    mkdirSync(join(ROOT, 'clash'), { recursive: true })

    const report = await sweepTargets([ROOT], { originOf: noOrigin })

    expect(report.targets).toEqual([])
  })

  // The census taken 2026-08-28 walked one clone of `caret` and the repair had
  // run in a second clone it never saw, which is what let a ticked outcome
  // contradict its own finding. Two clones are one project.
  it('should count two clones sharing an origin as one target', async () => {
    const first = stamp('public', 'caret')
    const second = stamp('extensions', 'chrome', 'caret')

    const report = await sweepTargets([ROOT], {
      originOf: async () => 'github.com/erclx/caret',
    })

    expect(report.targets).toHaveLength(1)
    expect([...(report.targets[0]?.paths ?? [])].sort()).toEqual(
      [first, second].sort(),
    )
  })

  it('should keep two checkouts with no resolvable origin apart', async () => {
    stamp('one')
    stamp('two')

    const report = await sweepTargets([ROOT], { originOf: noOrigin })

    expect(report.targets).toHaveLength(2)
  })

  it('should separate two targets whose origins differ', async () => {
    const caret = stamp('caret')

    stamp('stackr')

    const report = await sweepTargets([ROOT], {
      originOf: async (path) =>
        path === caret ? 'github.com/erclx/caret' : 'github.com/erclx/stackr',
    })

    expect(report.targets).toHaveLength(2)
  })

  // Measured on this machine: one stamped repository holds the eight folders
  // the hand census walked. Stopping at the outer one hides every target below
  // it, which is the whole population the sweep exists to find.
  it('should keep walking below a target it already found', async () => {
    const outer = stamp('career')
    const inner = stamp('career', 'public', 'stackr')

    const report = await sweepTargets([ROOT], { originOf: noOrigin })

    expect(report.targets.flatMap((target) => target.paths).sort()).toEqual(
      [outer, inner].sort(),
    )
  })

  // A linked worktree holds a full checkout carrying a copy of its own target's
  // stamp. One target here had five, and each would have counted as a target.
  it('should not read a linked worktree as a target of its own', async () => {
    const career = stamp('career')

    stamp('career', '.claude', 'worktrees', 'linkedin-sync')

    const report = await sweepTargets([ROOT], { originOf: noOrigin })

    expect(report.targets.flatMap((target) => target.paths)).toEqual([career])
  })

  // An answer that ran out of depth and an answer that found everything read
  // identically without this, which is exactly how the population was
  // undercounted by a folder nobody thought to look in.
  it('should name the folders it stopped at when the depth cap is reached', async () => {
    stamp('a', 'b', 'c', 'd', 'e', 'deep')

    const report = await sweepTargets([ROOT], { depth: 2, originOf: noOrigin })

    expect(report.targets).toEqual([])
    expect(report.bound.truncated).toContain(join(ROOT, 'a', 'b'))
  })

  // A depth that is not a number leaves every `level >= depth` test false, so
  // the walk runs to the bottom of its root while the bound claims a cap. The
  // command refuses such a value, and this holds the floor under that.
  it('should walk without a cap when handed a depth that is not a number', async () => {
    stamp('a', 'b', 'c', 'd', 'e', 'f', 'deep')

    const report = await sweepTargets([ROOT], {
      depth: Number.NaN,
      originOf: noOrigin,
    })

    expect(report.targets).toHaveLength(1)
    expect(report.bound.truncated).toEqual([])
  })

  it('should report the roots and the depth the answer is bounded by', async () => {
    const report = await sweepTargets([ROOT], { depth: 3, originOf: noOrigin })

    expect(report.bound.roots).toEqual([ROOT])
    expect(report.bound.depth).toBe(3)
  })

  it('should report a root that does not exist as unreadable rather than empty', async () => {
    const missing = join(ROOT, 'nowhere')

    const report = await sweepTargets([missing], { originOf: noOrigin })

    expect(report.bound.unreadable).toEqual([missing])
    expect(report.targets).toEqual([])
  })

  it('should skip a vendored tree rather than walking into it', async () => {
    stamp('node_modules', 'some-package')

    const report = await sweepTargets([ROOT], { originOf: noOrigin })

    expect(report.targets).toEqual([])
  })

  it('should report one target when two roots overlap', async () => {
    stamp('nested', 'caret')

    const report = await sweepTargets([ROOT, join(ROOT, 'nested')], {
      originOf: noOrigin,
    })

    expect(report.targets).toHaveLength(1)
  })
})
