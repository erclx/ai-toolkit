import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createStandardsAdapter } from '@/standards/adapter'
import type { InstalledFile } from '@/sync/engine'

let ROOT: string
let TOOLKIT: string
let TARGET: string

function writeFixture(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function writeDoc(path: string, title: string): void {
  writeFixture(
    path,
    `---\ntitle: ${title}\ndescription: ${title} reference\n---\n\n# ${title}\n`,
  )
}

function writeIndex(path: string, title: string): void {
  writeFixture(
    path,
    `---\ntitle: ${title}\nsubtitle: ${title} catalog\n---\n\n# ${title}\n`,
  )
}

function installedFile(relToRoot: string): InstalledFile {
  const path = join(TARGET, '.claude', 'standards', relToRoot)
  return { path, relToRoot, rel: join('.claude', 'standards', relToRoot) }
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-standards-adapter-'))
  TOOLKIT = join(ROOT, 'toolkit')
  TARGET = join(ROOT, 'target')
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('createStandardsAdapter', () => {
  it('should point the installed root at .claude/standards', () => {
    const adapter = createStandardsAdapter(TOOLKIT)

    expect(adapter.installedRoot(TARGET)).toBe(
      join(TARGET, '.claude', 'standards'),
    )
  })

  it('should match an installed standard to its flat source', () => {
    writeDoc(join(TOOLKIT, 'standards/prose.md'), 'Prose')
    const adapter = createStandardsAdapter(TOOLKIT)

    expect(adapter.locateSource(installedFile('prose.md'))).toBe(
      join(TOOLKIT, 'standards/prose.md'),
    )
  })

  it('should not match a standard that only exists in a source subfolder', () => {
    writeDoc(join(TOOLKIT, 'standards/bundled/commit.md'), 'Commit')
    const adapter = createStandardsAdapter(TOOLKIT)

    expect(adapter.locateSource(installedFile('commit.md'))).toBeUndefined()
  })

  it('should return undefined for a standard the toolkit does not ship', () => {
    writeDoc(join(TOOLKIT, 'standards/prose.md'), 'Prose')
    const adapter = createStandardsAdapter(TOOLKIT)

    expect(
      adapter.locateSource(installedFile('project-own.md')),
    ).toBeUndefined()
  })

  it('should exclude index.md from the walk', () => {
    const adapter = createStandardsAdapter(TOOLKIT)

    expect(adapter.isExcluded?.(installedFile('index.md'))).toBe(true)
  })

  it('should not exclude an ordinary standard', () => {
    const adapter = createStandardsAdapter(TOOLKIT)

    expect(adapter.isExcluded?.(installedFile('prose.md'))).toBe(false)
  })

  it('should refuse to apply drift in a headless run', () => {
    const adapter = createStandardsAdapter(TOOLKIT)

    expect(adapter.nonInteractive?.kind).toBe('refuse')
  })
})

describe('createStandardsAdapter onComplete', () => {
  it('should replace a stale target index with the toolkit source', async () => {
    writeIndex(join(TOOLKIT, 'standards/index.md'), 'Standards')
    writeDoc(join(TOOLKIT, 'standards/prose.md'), 'Prose')
    writeDoc(join(TARGET, '.claude/standards/prose.md'), 'Prose')
    writeFixture(join(TARGET, '.claude/standards/index.md'), 'stale\n')

    await createStandardsAdapter(TOOLKIT).onComplete?.(TARGET)

    const index = readFileSync(
      join(TARGET, '.claude/standards/index.md'),
      'utf8',
    )
    expect(index).not.toContain('stale')
    expect(index).toContain('# Standards')
  })

  it('should list a project-authored standard the toolkit does not ship', async () => {
    writeIndex(join(TOOLKIT, 'standards/index.md'), 'Standards')
    writeDoc(join(TARGET, '.claude/standards/project-own.md'), 'Project own')
    writeFixture(join(TARGET, '.claude/standards/index.md'), 'stale\n')

    await createStandardsAdapter(TOOLKIT).onComplete?.(TARGET)

    expect(
      readFileSync(join(TARGET, '.claude/standards/index.md'), 'utf8'),
    ).toContain('project-own.md')
  })

  it('should leave the target catalog alone when the toolkit ships no index', async () => {
    writeFixture(join(TARGET, '.claude/standards/index.md'), 'kept\n')

    await createStandardsAdapter(TOOLKIT).onComplete?.(TARGET)

    expect(
      readFileSync(join(TARGET, '.claude/standards/index.md'), 'utf8'),
    ).toBe('kept\n')
  })

  it('should not throw when a standard is missing frontmatter', async () => {
    writeIndex(join(TOOLKIT, 'standards/index.md'), 'Standards')
    writeFixture(join(TARGET, '.claude/standards/broken.md'), '# no matter\n')
    writeFixture(join(TARGET, '.claude/standards/index.md'), 'stale\n')

    await expect(
      createStandardsAdapter(TOOLKIT).onComplete?.(TARGET),
    ).resolves.toBeUndefined()

    expect(existsSync(join(TARGET, '.claude/standards/index.md'))).toBe(true)
  })
})
