import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { snippetsSourceDir } from '@/snippets/categories'
import {
  deriveDestRelPath,
  installSnippets,
  installableCategories,
  resolveSnippets,
} from '@/snippets/install'
import { presetsPath } from '@/snippets/presets'

let root: string
let target: string

function seedSnippet(relPath: string, body = 'Body'): void {
  const path = join(snippetsSourceDir(root), relPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

function seedPresets(body: string): void {
  mkdirSync(snippetsSourceDir(root), { recursive: true })
  writeFileSync(presetsPath(root), body)
}

function relPaths(resolution: ReturnType<typeof resolveSnippets>): string[] {
  return resolution.ok ? resolution.files.map((file) => file.relPath) : []
}

beforeEach(() => {
  const base = mkdtempSync(join(tmpdir(), 'aitk-snippets-install-'))
  root = join(base, 'toolkit')
  target = join(base, 'target')
  mkdirSync(snippetsSourceDir(root), { recursive: true })
  mkdirSync(target, { recursive: true })
})

afterEach(() => {
  rmSync(dirname(root), { recursive: true, force: true })
})

describe('deriveDestRelPath', () => {
  it('should flatten a snippet sitting at the source root', () => {
    const src = join(snippetsSourceDir(root), 'compact-summary.md')

    expect(deriveDestRelPath(root, src)).toBe('compact-summary.md')
  })

  it('should keep the immediate parent for a nested snippet', () => {
    const src = join(snippetsSourceDir(root), 'claude', 'decision-memo.md')

    expect(deriveDestRelPath(root, src)).toBe('claude/decision-memo.md')
  })
})

describe('resolveSnippets', () => {
  it('should collect every category for all', () => {
    seedSnippet('a-one.md')
    seedSnippet(join('claude', 'two.md'))
    seedSnippet(join('aitk', 'internal.md'))

    const resolution = resolveSnippets(root, 'all')

    expect(relPaths(resolution)).toEqual(['a-one.md', 'claude/two.md'])
  })

  it('should resolve a preset before a folder sharing its name', () => {
    seedSnippet('picked.md')
    seedSnippet(join('essentials', 'not-picked.md'))
    seedPresets('[essentials]\nnames = ["picked"]\n')

    const resolution = resolveSnippets(root, 'essentials')

    expect(relPaths(resolution)).toEqual(['picked.md'])
  })

  it('should skip a preset slug pointing into the internal category', () => {
    seedSnippet('kept.md')
    seedSnippet(join('aitk', 'internal.md'))
    seedPresets('[essentials]\nnames = ["kept", "aitk/internal"]\n')

    const resolution = resolveSnippets(root, 'essentials')

    expect(relPaths(resolution)).toEqual(['kept.md'])
    expect(resolution.ok && resolution.missing).toEqual([])
  })

  it('should report a preset slug with no source file', () => {
    seedSnippet('present.md')
    seedPresets('[essentials]\nnames = ["present", "ghost"]\n')

    const resolution = resolveSnippets(root, 'essentials')

    expect(resolution.ok && resolution.missing).toEqual(['ghost'])
    expect(relPaths(resolution)).toEqual(['present.md'])
  })

  it('should resolve base to the snippets at the source root', () => {
    seedSnippet('a-one.md')
    seedSnippet(join('claude', 'two.md'))

    expect(relPaths(resolveSnippets(root, 'base'))).toEqual(['a-one.md'])
  })

  it('should resolve a folder category to its own entries', () => {
    seedSnippet('a-one.md')
    seedSnippet(join('claude', 'two.md'))

    expect(relPaths(resolveSnippets(root, 'claude'))).toEqual(['claude/two.md'])
  })

  it('should reject a category that is neither a preset nor a folder', () => {
    expect(resolveSnippets(root, 'ghost')).toEqual({
      ok: false,
      unknownCategory: 'ghost',
    })
  })

  it('should reject a category naming a file beside the category folders', () => {
    seedPresets('[essentials]\nnames = ["a"]\n')

    expect(resolveSnippets(root, 'snippets.toml')).toEqual({
      ok: false,
      unknownCategory: 'snippets.toml',
    })
  })
})

describe('installableCategories', () => {
  it('should offer presets before base and the folder categories', () => {
    seedSnippet(join('claude', 'one.md'))
    seedPresets('[essentials]\nnames = ["a"]\n')

    expect(installableCategories(root)).toEqual([
      'essentials',
      'base',
      'claude',
    ])
  })
})

describe('installSnippets', () => {
  it('should install nested snippets under their category folder', async () => {
    seedSnippet(join('claude', 'two.md'), 'Two')
    const resolution = resolveSnippets(root, 'claude')

    const installed = resolution.ok
      ? await installSnippets(resolution.files, target)
      : []

    expect(installed).toEqual([join('.claude', 'snippets', 'claude/two.md')])
    expect(
      await readFile(
        join(target, '.claude', 'snippets', 'claude', 'two.md'),
        'utf8',
      ),
    ).toBe('Two')
  })

  it('should leave an existing destination mode alone', async () => {
    seedSnippet('one.md', 'New')
    const dest = join(target, '.claude', 'snippets', 'one.md')
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, 'Old')
    chmodSync(dest, 0o600)

    const resolution = resolveSnippets(root, 'base')
    if (resolution.ok) await installSnippets(resolution.files, target)

    expect((await stat(dest)).mode & 0o777).toBe(0o600)
    expect(await readFile(dest, 'utf8')).toBe('New')
  })
})
