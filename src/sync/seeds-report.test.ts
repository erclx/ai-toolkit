import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildSeedsReport } from '@/sync/seeds-report'

const SEEDS_DIR = join('tooling', 'claude', 'seeds')

let TOOLKIT: string
let TARGET: string

function write(root: string, rel: string, content: string): void {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function writeSeed(rel: string, content: string): void {
  write(TOOLKIT, join(SEEDS_DIR, rel), content)
}

function stateOf(rel: string, entries: ReturnType<typeof entriesOf>): string {
  return entries.find((entry) => entry.rel === rel)?.state ?? 'absent'
}

function entriesOf() {
  return buildSeedsReport(TOOLKIT, TARGET).entries
}

beforeEach(() => {
  TOOLKIT = mkdtempSync(join(tmpdir(), 'canon-seeds-toolkit-'))
  TARGET = mkdtempSync(join(tmpdir(), 'canon-seeds-target-'))
})

afterEach(() => {
  rmSync(TOOLKIT, { recursive: true, force: true })
  rmSync(TARGET, { recursive: true, force: true })
})

describe('buildSeedsReport', () => {
  it('should report nothing for a toolkit shipping no seeds', () => {
    expect(buildSeedsReport(TOOLKIT, TARGET)).toEqual({
      entries: [],
      historyUnavailable: false,
    })
  })

  it('should report a seed the target never installed as missing', () => {
    writeSeed('CLAUDE.md', 'seed body\n')

    expect(stateOf('CLAUDE.md', entriesOf())).toBe('missing')
  })

  it('should report an untouched seed as matching', () => {
    writeSeed('CLAUDE.md', 'seed body\n')
    write(TARGET, 'CLAUDE.md', 'seed body\n')

    expect(stateOf('CLAUDE.md', entriesOf())).toBe('matching')
  })

  it('should report an edited seed as drifted', () => {
    writeSeed('CLAUDE.md', 'seed body\n')
    write(TARGET, 'CLAUDE.md', 'project body\n')

    expect(stateOf('CLAUDE.md', entriesOf())).toBe('drifted')
  })

  it('should report a stub-marked seed installed stripped as matching', () => {
    writeSeed('CLAUDE.md', '---\ntitle: Project\nstub: true\n---\n\nbody\n')
    write(TARGET, 'CLAUDE.md', '---\ntitle: Project\n---\n\nbody\n')

    expect(stateOf('CLAUDE.md', entriesOf())).toBe('matching')
  })

  it('should still report an edited stub-marked seed as drifted', () => {
    writeSeed('CLAUDE.md', '---\ntitle: Project\nstub: true\n---\n\nbody\n')
    write(TARGET, 'CLAUDE.md', '---\ntitle: Project\n---\n\nproject body\n')

    expect(stateOf('CLAUDE.md', entriesOf())).toBe('drifted')
  })

  it('should classify a seed under .claude alongside the root one', () => {
    writeSeed(join('.claude', 'REQUIREMENTS.md'), 'seed body\n')
    write(TARGET, join('.claude', 'REQUIREMENTS.md'), 'seed body\n')

    expect(stateOf(join('.claude', 'REQUIREMENTS.md'), entriesOf())).toBe(
      'matching',
    )
  })

  it('should report history as unavailable when a differing seed cannot be attributed', () => {
    writeSeed('CLAUDE.md', 'seed body\n')
    write(TARGET, 'CLAUDE.md', 'project body\n')

    expect(buildSeedsReport(TOOLKIT, TARGET).historyUnavailable).toBe(true)
  })

  it('should not reach for history when every seed matches', () => {
    writeSeed('CLAUDE.md', 'seed body\n')
    write(TARGET, 'CLAUDE.md', 'seed body\n')

    expect(buildSeedsReport(TOOLKIT, TARGET).historyUnavailable).toBe(false)
  })
})
