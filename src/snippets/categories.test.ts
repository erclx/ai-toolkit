import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  categoryExists,
  isInternalCategory,
  isInternalCategoryName,
  listCategories,
  listEntries,
  listFolderCategories,
  snippetsSourceDir,
} from '@/snippets/categories'

let root: string

function seedSnippet(relPath: string, body = 'Body'): void {
  const path = join(snippetsSourceDir(root), relPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'aitk-snippets-categories-'))
  mkdirSync(snippetsSourceDir(root), { recursive: true })
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('isInternalCategoryName', () => {
  it('should flag the toolkit internal category', () => {
    expect(isInternalCategoryName('aitk')).toBe(true)
  })

  it('should not flag a shipped category', () => {
    expect(isInternalCategoryName('claude')).toBe(false)
  })
})

describe('isInternalCategory', () => {
  it('should flag a snippet under an internal category folder', () => {
    expect(isInternalCategory(join('aitk', 'format-edits.md'))).toBe(true)
  })

  it('should not flag a snippet under a shipped category folder', () => {
    expect(isInternalCategory(join('claude', 'decision-memo.md'))).toBe(false)
  })

  it('should not flag a root-level snippet whose name is its first segment', () => {
    expect(isInternalCategory('compact-summary.md')).toBe(false)
  })

  it('should not flag an internal name nested below another category', () => {
    expect(isInternalCategory(join('claude', 'aitk', 'nested.md'))).toBe(false)
  })
})

describe('listFolderCategories', () => {
  it('should filter the internal category out of discovery', () => {
    seedSnippet(join('claude', 'one.md'))
    seedSnippet(join('aitk', 'two.md'))

    expect(listFolderCategories(root)).toEqual(['claude'])
  })

  it('should return an empty list when no snippets source exists', () => {
    expect(listFolderCategories(join(root, 'nowhere'))).toEqual([])
  })
})

describe('listCategories', () => {
  it('should lead with base and then the folder categories', () => {
    seedSnippet(join('gemini', 'one.md'))
    seedSnippet(join('claude', 'two.md'))

    expect(listCategories(root)).toEqual(['base', 'claude', 'gemini'])
  })
})

describe('listEntries', () => {
  it('should read base as the snippets sitting at the source root', () => {
    seedSnippet('b-two.md')
    seedSnippet('a-one.md')
    seedSnippet(join('claude', 'nested.md'))

    expect(listEntries(root, 'base')).toEqual(['a-one', 'b-two'])
  })

  it('should read a folder category one level deep only', () => {
    seedSnippet(join('claude', 'one.md'))
    seedSnippet(join('claude', 'deeper', 'two.md'))

    expect(listEntries(root, 'claude')).toEqual(['one'])
  })

  it('should return an empty list for a category that does not exist', () => {
    expect(listEntries(root, 'ghost')).toEqual([])
  })
})

describe('categoryExists', () => {
  it('should report a folder category that exists', () => {
    seedSnippet(join('claude', 'one.md'))

    expect(categoryExists(root, 'claude')).toBe(true)
  })

  it('should report a folder category that does not exist', () => {
    expect(categoryExists(root, 'ghost')).toBe(false)
  })
})
