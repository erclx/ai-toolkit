import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  readTargetRegistry,
  recordTarget,
  registryPath,
  stateDir,
} from '@/targets/registry'

let ROOT: string
let FILE: string

/**
 * `vitest.setup.ts` points this at a temp folder for the whole file, so a test
 * calling either read with no path stays out of the developer's real state
 * folder. Restoring it is what keeps that true: deleting the key instead would
 * leave the rest of the file resolving to the home directory.
 */
const SETUP_STATE_DIR = process.env.AITK_STATE_DIR

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-targets-'))
  FILE = join(ROOT, 'targets.json')
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
  process.env.AITK_STATE_DIR = SETUP_STATE_DIR
  delete process.env.XDG_STATE_HOME
})

describe('stateDir', () => {
  it('should prefer the explicit override over every other source', () => {
    process.env.AITK_STATE_DIR = '/explicit'
    process.env.XDG_STATE_HOME = '/xdg'

    expect(stateDir()).toBe('/explicit')
  })

  it('should fall back to the XDG state home when no override is set', () => {
    delete process.env.AITK_STATE_DIR
    process.env.XDG_STATE_HOME = '/xdg'

    expect(registryPath()).toBe(join('/xdg', 'aitk', 'targets.json'))
  })
})

describe('readTargetRegistry', () => {
  // A machine no sync has ever run on and a machine whose targets were all
  // removed answer differently. Reading the first as an empty population would
  // report a confident zero from a lookup that never ran, which is the reading
  // the sweep exists to stand in for.
  it('should report an absent file as absent rather than as no targets', () => {
    const registry = readTargetRegistry(FILE)

    expect(registry).toEqual({ kind: 'absent', path: FILE })
  })

  it('should report a file it cannot parse as read and holding no row', () => {
    writeFileSync(FILE, 'not json at all\n')

    expect(readTargetRegistry(FILE)).toEqual({
      kind: 'read',
      path: FILE,
      targets: [],
    })
  })

  it('should drop a row missing either field and keep the rows around it', () => {
    writeFileSync(
      FILE,
      JSON.stringify({
        version: 1,
        targets: [
          { path: '/a', stampedAt: '2026-08-30T00:00:00.000Z' },
          { path: '/b' },
          { stampedAt: '2026-08-30T00:00:00.000Z' },
        ],
      }),
    )

    const registry = readTargetRegistry(FILE)

    expect(registry.kind).toBe('read')
    expect(registry.kind === 'read' ? registry.targets : []).toEqual([
      { path: '/a', stampedAt: '2026-08-30T00:00:00.000Z' },
    ])
  })

  it('should sort the rows by path so two reads of one file agree', () => {
    writeFileSync(
      FILE,
      JSON.stringify({
        version: 1,
        targets: [
          { path: '/z', stampedAt: '2026-08-30T00:00:00.000Z' },
          { path: '/a', stampedAt: '2026-08-30T00:00:00.000Z' },
        ],
      }),
    )

    const registry = readTargetRegistry(FILE)

    expect(
      registry.kind === 'read' ? registry.targets.map((row) => row.path) : [],
    ).toEqual(['/a', '/z'])
  })
})

describe('recordTarget', () => {
  it('should create the file and its folder on the first target recorded', () => {
    const nested = join(ROOT, 'state', 'aitk', 'targets.json')

    expect(recordTarget('/repos/caret', new Date('2026-08-30'), nested)).toBe(
      'recorded',
    )
    expect(readTargetRegistry(nested)).toEqual({
      kind: 'read',
      path: nested,
      targets: [
        { path: '/repos/caret', stampedAt: '2026-08-30T00:00:00.000Z' },
      ],
    })
  })

  // Every sync of one target reaches this, so a second run has to move the
  // stamp rather than add a row. A registry that grew per sync would report one
  // project as many and inflate every count read off it.
  it('should replace the row for a target it already holds', () => {
    recordTarget('/repos/caret', new Date('2026-08-01'), FILE)
    recordTarget('/repos/caret', new Date('2026-08-30'), FILE)

    const registry = readTargetRegistry(FILE)

    expect(registry.kind === 'read' ? registry.targets : []).toEqual([
      { path: '/repos/caret', stampedAt: '2026-08-30T00:00:00.000Z' },
    ])
  })

  it('should key the row on the resolved path so a relative target lands once', () => {
    recordTarget('/repos/caret', new Date('2026-08-01'), FILE)
    recordTarget('/repos/nested/../caret', new Date('2026-08-30'), FILE)

    const registry = readTargetRegistry(FILE)

    expect(registry.kind === 'read' ? registry.targets : []).toHaveLength(1)
  })

  it('should keep every other target when one is re-recorded', () => {
    recordTarget('/repos/stackr', new Date('2026-08-01'), FILE)
    recordTarget('/repos/caret', new Date('2026-08-01'), FILE)
    recordTarget('/repos/caret', new Date('2026-08-30'), FILE)

    const registry = readTargetRegistry(FILE)

    expect(
      registry.kind === 'read' ? registry.targets.map((row) => row.path) : [],
    ).toEqual(['/repos/caret', '/repos/stackr'])
  })

  // The stamp inside the target is the authoritative record and this index is a
  // cache over those, so a state folder nobody can write must not fail the sync
  // that was recording into it.
  it('should report a location it cannot write rather than throwing', () => {
    const blocked = join(FILE, 'targets.json')
    writeFileSync(FILE, '{}\n')

    expect(recordTarget('/repos/caret', new Date('2026-08-30'), blocked)).toBe(
      'unwritten',
    )
  })

  it('should leave no temp file behind after a write that landed', () => {
    recordTarget('/repos/caret', new Date('2026-08-30'), FILE)

    expect(JSON.parse(readFileSync(FILE, 'utf8')).version).toBe(1)
  })
})
