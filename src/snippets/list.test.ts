import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { snippetsSourceDir } from '@/snippets/categories'
import { buildSnippetsCatalog } from '@/snippets/list'
import { presetsPath } from '@/snippets/presets'

let root: string

function seedSnippet(relPath: string): void {
  const path = join(snippetsSourceDir(root), relPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, 'Body')
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'canon-snippets-list-'))
  mkdirSync(snippetsSourceDir(root), { recursive: true })
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('buildSnippetsCatalog', () => {
  it('should emit presets and categories under the keys skills read', () => {
    seedSnippet('one.md')
    seedSnippet(join('claude', 'two.md'))
    writeFileSync(presetsPath(root), '[essentials]\nnames = ["one"]\n')

    expect(buildSnippetsCatalog(root)).toEqual({
      presets: [{ name: 'essentials', slugs: ['one'] }],
      categories: [
        { name: 'base', entries: ['one'] },
        { name: 'claude', entries: ['two'] },
      ],
    })
  })

  it('should serialize a name carrying a quote as valid JSON', () => {
    seedSnippet('say "hi".md')

    const json = JSON.stringify(buildSnippetsCatalog(root))

    expect(JSON.parse(json).categories[0].entries).toEqual(['say "hi"'])
  })

  it('should emit an empty preset list when snippets.toml is absent', () => {
    expect(buildSnippetsCatalog(root).presets).toEqual([])
  })
})
