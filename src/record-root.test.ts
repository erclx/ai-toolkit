import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CREATION_ROOT,
  creationDir,
  creationRel,
  RECORD_ROOTS,
  recordDir,
  recordDirs,
  recordRoot,
  SCRATCH,
} from '@/record-root'

let ROOT = ''

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'canon-record-root-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

function seed(...segments: string[]): void {
  mkdirSync(join(ROOT, ...segments), { recursive: true })
}

describe('RECORD_ROOTS', () => {
  it('should read the new root ahead of the old one', () => {
    expect(RECORD_ROOTS).toEqual(['.canon', '.claude'])
  })

  it('should create at the old root while the move is pending', () => {
    expect(CREATION_ROOT).toBe('.claude')
  })
})

describe('recordDir', () => {
  it('should resolve at the new root when only it carries the folder', () => {
    seed('.canon', 'plans')

    expect(recordDir(ROOT, 'plans')).toBe(join(ROOT, '.canon', 'plans'))
  })

  it('should resolve at the old root when only it carries the folder', () => {
    seed('.claude', 'plans')

    expect(recordDir(ROOT, 'plans')).toBe(join(ROOT, '.claude', 'plans'))
  })

  it('should prefer the new root when both carry the folder', () => {
    seed('.canon', 'plans')
    seed('.claude', 'plans')

    expect(recordDir(ROOT, 'plans')).toBe(join(ROOT, '.canon', 'plans'))
  })

  it('should fall back to the creation default when neither carries it', () => {
    expect(recordDir(ROOT, 'plans')).toBe(join(ROOT, '.claude', 'plans'))
  })

  it('should read presence on the record folder rather than on what sits inside it', () => {
    seed('.canon', 'plans')

    expect(recordDir(ROOT, 'plans', 'archive')).toBe(
      join(ROOT, '.canon', 'plans', 'archive'),
    )
  })

  it('should drop the scratch folder dot at the new root', () => {
    seed('.canon', 'tmp')

    expect(recordDir(ROOT, SCRATCH, 'gov', 'rules.md')).toBe(
      join(ROOT, '.canon', 'tmp', 'gov', 'rules.md'),
    )
  })

  it('should keep the scratch folder dot at the old root', () => {
    seed('.claude', '.tmp')

    expect(recordDir(ROOT, SCRATCH, 'gov', 'rules.md')).toBe(
      join(ROOT, '.claude', '.tmp', 'gov', 'rules.md'),
    )
  })

  it('should not read a new root that carries the old scratch spelling', () => {
    seed('.canon', '.tmp')

    expect(recordDir(ROOT, SCRATCH)).toBe(join(ROOT, '.claude', '.tmp'))
  })
})

describe('recordDirs', () => {
  it('should name both roots in precedence order whatever is on disk', () => {
    expect(recordDirs(ROOT, 'plans', 'archive')).toEqual([
      join(ROOT, '.canon', 'plans', 'archive'),
      join(ROOT, '.claude', 'plans', 'archive'),
    ])
  })

  it('should name each root scratch spelling', () => {
    expect(recordDirs(ROOT, SCRATCH)).toEqual([
      join(ROOT, '.canon', 'tmp'),
      join(ROOT, '.claude', '.tmp'),
    ])
  })
})

describe('creationDir', () => {
  it('should stay at the old root even where the new one carries the folder', () => {
    seed('.canon', 'review')

    expect(creationDir(ROOT, 'review', 'feedback')).toBe(
      join(ROOT, '.claude', 'review', 'feedback'),
    )
  })
})

describe('creationRel', () => {
  it('should spell the creation destination relative to the project root', () => {
    expect(creationRel('review', 'slides')).toBe(
      join('.claude', 'review', 'slides'),
    )
  })
})

describe('recordRoot', () => {
  it('should take the new root when it exists', () => {
    seed('.canon')
    seed('.claude')

    expect(recordRoot(ROOT)).toBe(join(ROOT, '.canon'))
  })

  it('should take the old root when the new one is absent', () => {
    seed('.claude')

    expect(recordRoot(ROOT)).toBe(join(ROOT, '.claude'))
  })

  it('should fall back to the creation default when neither exists', () => {
    expect(recordRoot(ROOT)).toBe(join(ROOT, '.claude'))
  })
})
