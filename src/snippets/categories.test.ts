import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  categoryExists,
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
  root = mkdtempSync(join(tmpdir(), 'canon-snippets-categories-'))
  mkdirSync(snippetsSourceDir(root), { recursive: true })
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('listFolderCategories', () => {
  it('should return every folder under the snippets source', () => {
    seedSnippet(join('claude', 'one.md'))
    seedSnippet(join('gemini', 'two.md'))

    expect(listFolderCategories(root)).toEqual(['claude', 'gemini'])
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

  it('should not accept a file sitting beside the category folders', () => {
    seedSnippet('snippets.toml')

    expect(categoryExists(root, 'snippets.toml')).toBe(false)
  })

  it('should refuse an empty category rather than resolving to the source root', () => {
    seedSnippet('a-one.md')

    expect(categoryExists(root, '')).toBe(false)
  })
})

describe('listEntries', () => {
  it('should return an empty list when the category names a file', () => {
    seedSnippet('snippets.toml')

    expect(listEntries(root, 'snippets.toml')).toEqual([])
  })
})
