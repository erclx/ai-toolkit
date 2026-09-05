import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildIndexCatalog } from '@/indexes/list'

let root: string

function writeIndex(dir: string, title: string, subtitle: string): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'index.md'),
    `---\ntitle: ${title}\nsubtitle: ${subtitle}\n---\n\nplaceholder\n`,
  )
}

function writeEntry(
  dir: string,
  name: string,
  fields: Record<string, string>,
): void {
  const block = Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
  writeFileSync(join(dir, name), `---\n${block}\n---\n\nbody\n`)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'canon-indexes-list-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('buildIndexCatalog', () => {
  it('should flatten a flat folder into entries relative to root', async () => {
    writeIndex(root, 'Wiki', 'Reference pages')
    writeEntry(root, 'alpha.md', { title: 'Alpha', description: 'First page' })
    writeEntry(root, 'beta.md', { title: 'Beta', description: 'Second page' })

    const catalog = await buildIndexCatalog(root)

    expect(catalog).toEqual({
      entries: [
        { path: 'alpha.md', title: 'Alpha', description: 'First page' },
        { path: 'beta.md', title: 'Beta', description: 'Second page' },
        { path: 'index.md', title: 'Wiki', description: 'Reference pages' },
      ],
      errors: [],
    })
  })

  it('should flatten a category-grouped folder the same as a flat one', async () => {
    writeIndex(root, 'Docs', 'One line each')
    writeEntry(root, 'one.md', {
      title: 'One',
      description: 'First',
      category: 'Zebra',
    })
    writeEntry(root, 'two.md', {
      title: 'Two',
      description: 'Second',
      category: 'Alpha',
    })

    const catalog = await buildIndexCatalog(root)

    expect(catalog.entries.map((entry) => entry.path)).toEqual([
      'index.md',
      'one.md',
      'two.md',
    ])
  })

  it('should list a nested sub-catalog with a path relative to root', async () => {
    writeIndex(root, 'Parent', 'Top level')
    writeEntry(root, 'page.md', { title: 'Page', description: 'A page' })
    writeIndex(join(root, 'child'), 'Child', 'Nested catalog')
    writeEntry(join(root, 'child'), 'leaf.md', {
      title: 'Leaf',
      description: 'A leaf page',
    })

    const catalog = await buildIndexCatalog(root)

    expect(catalog.entries).toContainEqual({
      path: 'child/index.md',
      title: 'Child',
      description: 'Nested catalog',
    })
    expect(catalog.entries).toContainEqual({
      path: 'child/leaf.md',
      title: 'Leaf',
      description: 'A leaf page',
    })
  })

  it('should sort entries by path relative to root', async () => {
    writeIndex(root, 'Parent', 'Top level')
    writeEntry(root, 'zebra.md', { title: 'Zebra', description: 'Last' })
    writeIndex(join(root, 'aardvark'), 'Aardvark', 'First folder')

    const catalog = await buildIndexCatalog(root)

    expect(catalog.entries.map((entry) => entry.path)).toEqual([
      'aardvark/index.md',
      'index.md',
      'zebra.md',
    ])
  })

  it('should isolate one folder frontmatter error without dropping other folders', async () => {
    writeIndex(root, 'Parent', 'Top level')
    writeEntry(root, 'good.md', { title: 'Good', description: 'Fine' })
    writeIndex(join(root, 'broken'), 'Broken', 'Missing a field')
    writeEntry(join(root, 'broken'), 'bad.md', { title: 'NoDescription' })

    const catalog = await buildIndexCatalog(root)

    expect(catalog.entries).toContainEqual({
      path: 'good.md',
      title: 'Good',
      description: 'Fine',
    })
    expect(catalog.entries).toContainEqual({
      path: 'broken/index.md',
      title: 'Broken',
      description: 'Missing a field',
    })
    expect(
      catalog.entries.some((entry) => entry.path.startsWith('broken/bad')),
    ).toBe(false)
    expect(catalog.errors.join()).toContain('description')
  })
})
