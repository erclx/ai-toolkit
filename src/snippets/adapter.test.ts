import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSnippetsAdapter } from '@/snippets/adapter'
import { snippetsSourceDir } from '@/snippets/categories'
import type { InstalledFile } from '@/sync/engine'

let ROOT: string
let TOOLKIT: string
let TARGET: string

function writeFixture(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function installedFile(relToRoot: string): InstalledFile {
  const path = join(TARGET, '.claude', 'snippets', relToRoot)
  return { path, relToRoot, rel: join('.claude', 'snippets', relToRoot) }
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-snippets-adapter-'))
  TOOLKIT = join(ROOT, 'toolkit')
  TARGET = join(ROOT, 'target')
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('createSnippetsAdapter', () => {
  it('should point the installed root at .claude/snippets', () => {
    const adapter = createSnippetsAdapter(TOOLKIT)

    expect(adapter.installedRoot(TARGET)).toBe(
      join(TARGET, '.claude', 'snippets'),
    )
  })

  it('should match a root-level snippet to its source', () => {
    writeFixture(join(TOOLKIT, 'snippets/compact-summary.md'), 'a')
    const adapter = createSnippetsAdapter(TOOLKIT)

    expect(adapter.locateSource(installedFile('compact-summary.md'))).toBe(
      join(TOOLKIT, 'snippets/compact-summary.md'),
    )
  })

  it('should match a nested snippet to its source by relative path', () => {
    writeFixture(join(TOOLKIT, 'snippets/claude/decision-memo.md'), 'a')
    const adapter = createSnippetsAdapter(TOOLKIT)

    expect(
      adapter.locateSource(installedFile(join('claude', 'decision-memo.md'))),
    ).toBe(join(TOOLKIT, 'snippets/claude/decision-memo.md'))
  })

  it('should not match a snippet that moved to a different category', () => {
    writeFixture(join(TOOLKIT, 'snippets/gemini/decision-memo.md'), 'a')
    const adapter = createSnippetsAdapter(TOOLKIT)

    expect(
      adapter.locateSource(installedFile(join('claude', 'decision-memo.md'))),
    ).toBeUndefined()
  })

  it('should return undefined for a snippet the toolkit no longer ships', () => {
    writeFixture(join(TOOLKIT, 'snippets/compact-summary.md'), 'a')
    const adapter = createSnippetsAdapter(TOOLKIT)

    expect(adapter.locateSource(installedFile('retired.md'))).toBeUndefined()
  })

  it('should leave the retired hook unset', () => {
    expect(createSnippetsAdapter(TOOLKIT).collectRetired).toBeUndefined()
  })

  it('should declare project as the project-authored subfolder', () => {
    expect(createSnippetsAdapter(TOOLKIT).projectSubdir).toBe('project')
  })

  it('should not ship a project/ snippet category, which the subfolder reserves for a target', () => {
    expect(existsSync(join(snippetsSourceDir(process.cwd()), 'project'))).toBe(
      false,
    )
  })
})
