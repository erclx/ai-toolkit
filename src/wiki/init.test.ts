import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  applyWikiInit,
  isWikiTarget,
  legacyWikiDir,
  planWikiInit,
  wikiDir,
} from '@/wiki/init'

let TARGET: string

function seedWiki(): string {
  const dir = wikiDir(TARGET)
  mkdirSync(dir, { recursive: true })
  return dir
}

function seedLegacyWiki(): string {
  const dir = legacyWikiDir(TARGET)
  mkdirSync(dir, { recursive: true })
  return dir
}

beforeEach(() => {
  TARGET = mkdtempSync(join(tmpdir(), 'canon-wiki-init-'))
})

afterEach(() => {
  rmSync(TARGET, { recursive: true, force: true })
})

describe('planWikiInit', () => {
  it('should plan both the directory and the index for a bare target', () => {
    expect(planWikiInit(TARGET)).toEqual({
      changes: ['dir', 'index'],
      hasIndex: false,
      hasLegacyWiki: false,
    })
  })

  it('should plan only the index when the directory already exists', () => {
    seedWiki()

    expect(planWikiInit(TARGET)).toEqual({
      changes: ['index'],
      hasIndex: false,
      hasLegacyWiki: false,
    })
  })

  it('should plan nothing when the index is already present', () => {
    writeFileSync(join(seedWiki(), 'index.md'), 'existing\n')

    expect(planWikiInit(TARGET)).toEqual({
      changes: [],
      hasIndex: true,
      hasLegacyWiki: false,
    })
  })

  it('should report a root wiki without planning a migration', () => {
    seedLegacyWiki()

    expect(planWikiInit(TARGET)).toEqual({
      changes: ['dir', 'index'],
      hasIndex: false,
      hasLegacyWiki: true,
    })
  })
})

describe('wikiDir', () => {
  it('should resolve under the target .claude folder', () => {
    expect(wikiDir(TARGET)).toBe(join(TARGET, '.claude', 'wiki'))
  })
})

describe('isWikiTarget', () => {
  it('should accept an existing directory', () => {
    expect(isWikiTarget(TARGET)).toBe(true)
  })

  it('should reject a path that does not exist', () => {
    expect(isWikiTarget(join(TARGET, 'no', 'such', 'dir'))).toBe(false)
  })

  it('should reject a path that is a file', () => {
    const file = join(TARGET, 'notes.md')
    writeFileSync(file, 'x\n')

    expect(isWikiTarget(file)).toBe(false)
  })
})

describe('applyWikiInit', () => {
  it('should write an index carrying the title and subtitle frontmatter', async () => {
    await applyWikiInit(TARGET, planWikiInit(TARGET))

    expect(readFileSync(join(wikiDir(TARGET), 'index.md'), 'utf8')).toBe(
      '---\ntitle: Wiki\nsubtitle: Reference pages for tools, workflows, and concepts\n---\n\n# Wiki\n\nReference pages for tools, workflows, and concepts.\n',
    )
  })

  it('should create the directory when the target has none', async () => {
    await applyWikiInit(TARGET, planWikiInit(TARGET))

    expect(statSync(wikiDir(TARGET)).isDirectory()).toBe(true)
  })

  it('should leave a root wiki in place', async () => {
    const page = join(seedLegacyWiki(), 'setup.md')
    writeFileSync(page, 'authored\n')

    await applyWikiInit(TARGET, planWikiInit(TARGET))

    expect(readFileSync(page, 'utf8')).toBe('authored\n')
  })

  it('should leave an existing index untouched', async () => {
    const index = join(seedWiki(), 'index.md')
    writeFileSync(index, 'mine\n')

    await applyWikiInit(TARGET, planWikiInit(TARGET))

    expect(readFileSync(index, 'utf8')).toBe('mine\n')
  })
})
