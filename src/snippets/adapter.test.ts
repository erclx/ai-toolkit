import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSnippetsAdapter, isInternalCategory } from '@/snippets/adapter'
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

  it('should return undefined for an internal-category snippet that exists at source', () => {
    writeFixture(join(TOOLKIT, 'snippets/aitk/format-edits.md'), 'a')
    const adapter = createSnippetsAdapter(TOOLKIT)

    expect(
      adapter.locateSource(installedFile(join('aitk', 'format-edits.md'))),
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
})
