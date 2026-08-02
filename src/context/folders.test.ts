import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { presentNames, resolveFolders } from '@/context/folders'

let ROOT: string

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-folders-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

function seed(relativeDir: string, names: string[]): void {
  const dir = join(ROOT, relativeDir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'index.md'),
    '---\ntitle: X\nsubtitle: Y\n---\n\n# X\n',
  )

  for (const name of names) {
    writeFileSync(
      join(dir, name),
      `---\ntitle: X\ndescription: Y\n---\n\n# X\n`,
    )
  }
}

describe('resolveFolders', () => {
  it('should resolve the default folders that are present', async () => {
    seed('.claude/context', ['ci.md'])
    seed('.claude/diagrams', ['components.md'])

    const folders = await resolveFolders(ROOT)

    expect(folders.map((folder) => folder.rel)).toEqual([
      '.claude/context',
      '.claude/diagrams',
    ])
  })

  it('should skip a default folder the project does not carry', async () => {
    seed('.claude/context', ['ci.md'])

    expect(await resolveFolders(ROOT)).toHaveLength(1)
  })

  it('should audit a split domain as its own folder', async () => {
    seed('.claude/context', ['ci.md'])
    seed('.claude/context/claude-plugin', ['skills.md', 'overview.md'])

    const folders = await resolveFolders(ROOT)

    expect(folders.map((folder) => folder.rel)).toEqual([
      '.claude/context',
      '.claude/context/claude-plugin',
    ])
  })

  it('should exclude the index from a folder entry list', async () => {
    seed('.claude/context', ['ci.md', 'cli.md'])

    const [folder] = await resolveFolders(ROOT)

    expect(folder.entries.map((path) => basename(path))).toEqual([
      'ci.md',
      'cli.md',
    ])
  })

  it('should ignore a folder with entries but no index', async () => {
    mkdirSync(join(ROOT, '.claude/context'), { recursive: true })
    writeFileSync(join(ROOT, '.claude/context/ci.md'), '# CI\n')

    expect(await resolveFolders(ROOT)).toEqual([])
  })

  it('should honor an explicit folder list', async () => {
    seed('.claude/context', ['ci.md'])
    seed('.claude/diagrams', ['components.md'])

    const folders = await resolveFolders(ROOT, ['diagrams'])

    expect(folders.map((folder) => folder.rel)).toEqual(['.claude/diagrams'])
  })
})

describe('presentNames', () => {
  it('should name each present folder once regardless of its split entries', async () => {
    seed('.claude/context', ['ci.md'])
    seed('.claude/context/claude-plugin', ['skills.md'])
    seed('.claude/diagrams', ['components.md'])

    expect(presentNames(await resolveFolders(ROOT))).toEqual([
      'context',
      'diagrams',
    ])
  })

  it('should omit a folder the project does not carry', async () => {
    seed('.claude/context', ['ci.md'])

    expect(presentNames(await resolveFolders(ROOT))).not.toContain('wireframes')
  })
})
