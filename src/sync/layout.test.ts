import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { collectSuperseded, detectUnmigrated } from '@/sync/layout'

let TARGET: string
let TOOLKIT: string

function write(root: string, rel: string, content = 'body\n'): void {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function writeFixture(rel: string, content = 'body\n'): void {
  write(TARGET, rel, content)
}

beforeEach(() => {
  TARGET = mkdtempSync(join(tmpdir(), 'aitk-layout-'))
  TOOLKIT = mkdtempSync(join(tmpdir(), 'aitk-layout-toolkit-'))
  write(TOOLKIT, join('standards', 'prose.md'))
  write(TOOLKIT, join('standards', 'tasks.md'))
  write(TOOLKIT, join('snippets', 'review', 'diff.md'))
})

afterEach(() => {
  rmSync(TARGET, { recursive: true, force: true })
  rmSync(TOOLKIT, { recursive: true, force: true })
})

describe('collectSuperseded', () => {
  it('should return nothing for a target holding no retired artifact', () => {
    writeFixture(join('.claude', 'tasks', 'index.md'))

    expect(collectSuperseded(TARGET)).toEqual([])
  })

  it('should report a single file the seed folder of the same stem replaced', () => {
    writeFixture(join('.claude', 'TASKS.md'))

    expect(collectSuperseded(TARGET)).toEqual([
      {
        rel: join('.claude', 'TASKS.md'),
        replacedBy: join('.claude', 'tasks'),
      },
    ])
  })

  it('should report every retired artifact the target still holds', () => {
    writeFixture(join('.claude', 'TASKS.md'))
    writeFixture(join('.claude', 'DIAGRAMS.md'))
    writeFixture(join('.claude', 'WIREFRAMES.md'))

    expect(collectSuperseded(TARGET).map((entry) => entry.rel)).toEqual([
      join('.claude', 'DIAGRAMS.md'),
      join('.claude', 'TASKS.md'),
      join('.claude', 'WIREFRAMES.md'),
    ])
  })

  it('should not match a suffixed variant of a retired artifact', () => {
    writeFixture(join('.claude', 'TASKS-ARCHIVE.md'))

    expect(collectSuperseded(TARGET)).toEqual([])
  })

  it('should report the retired file even when its replacement folder exists', () => {
    writeFixture(join('.claude', 'TASKS.md'))
    writeFixture(join('.claude', 'tasks', 'index.md'))

    expect(collectSuperseded(TARGET)).toHaveLength(1)
  })
})

describe('detectUnmigrated', () => {
  it('should return nothing for a target with neither layout', () => {
    expect(detectUnmigrated(TOOLKIT, TARGET)).toEqual([])
  })

  it('should report a domain installed at the root with nothing under .claude', () => {
    writeFixture(join('standards', 'prose.md'))
    writeFixture(join('standards', 'tasks.md'))

    expect(detectUnmigrated(TOOLKIT, TARGET)).toEqual([
      {
        domain: 'standards',
        rootPath: 'standards',
        installPath: join('.claude', 'standards'),
        files: 2,
      },
    ])
  })

  it('should report nothing once the domain also sits under .claude', () => {
    writeFixture(join('standards', 'prose.md'))
    writeFixture(join('.claude', 'standards', 'prose.md'))

    expect(detectUnmigrated(TOOLKIT, TARGET)).toEqual([])
  })

  it('should report snippets and standards independently', () => {
    writeFixture(join('snippets', 'diff.md'))
    writeFixture(join('.claude', 'standards', 'prose.md'))

    expect(
      detectUnmigrated(TOOLKIT, TARGET).map((entry) => entry.domain),
    ).toEqual(['snippets'])
  })

  it('should ignore an empty root folder carrying no markdown', () => {
    mkdirSync(join(TARGET, 'standards'), { recursive: true })

    expect(detectUnmigrated(TOOLKIT, TARGET)).toEqual([])
  })

  it('should not claim a root folder holding only project-authored files', () => {
    writeFixture(join('standards', 'our-house-style.md'))
    writeFixture(join('standards', 'onboarding.md'))

    expect(detectUnmigrated(TOOLKIT, TARGET)).toEqual([])
  })

  it('should count only the files the toolkit ships for that domain', () => {
    writeFixture(join('standards', 'prose.md'))
    writeFixture(join('standards', 'our-house-style.md'))

    expect(detectUnmigrated(TOOLKIT, TARGET)[0]?.files).toBe(1)
  })

  it('should match a nested snippet against its flattened root copy', () => {
    writeFixture(join('snippets', 'diff.md'))

    expect(detectUnmigrated(TOOLKIT, TARGET)[0]?.domain).toBe('snippets')
  })
})
