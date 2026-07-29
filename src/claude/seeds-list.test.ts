import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listSeeds, readSeedContents } from '@/claude/seeds-list'

let root: string

function seedFile(relPath: string, body: string): void {
  const path = join(root, 'tooling', 'claude', 'seeds', relPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'aitk-seeds-list-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('listSeeds', () => {
  it('should map each seed to its name, source, and install target', () => {
    seedFile(join('.claude', 'TASKS.md'), 'Tasks')

    expect(listSeeds(root)).toEqual([
      {
        name: 'TASKS.md',
        source: join('tooling', 'claude', 'seeds', '.claude', 'TASKS.md'),
        target: join('.claude', 'TASKS.md'),
        src: join(root, 'tooling', 'claude', 'seeds', '.claude', 'TASKS.md'),
      },
    ])
  })

  it('should list the context seed the bash listing never reported', () => {
    seedFile(join('.claude', 'context', 'index.md'), 'Context')

    expect(listSeeds(root).map((entry) => entry.target)).toEqual([
      join('.claude', 'context', 'index.md'),
    ])
  })

  it('should list hooks and wireframes alongside the claude root level', () => {
    seedFile(join('.claude', 'settings.json'), '{}')
    seedFile(join('.claude', 'hooks', 'scratch-guard.sh'), 'Hook')
    seedFile(join('.claude', 'wireframes', 'index.md'), 'Wireframes')

    expect(listSeeds(root).map((entry) => entry.name)).toEqual([
      'settings.json',
      'hooks/scratch-guard.sh',
      'wireframes/index.md',
    ])
  })

  it('should place the project-level CLAUDE.md last', () => {
    seedFile(join('.claude', 'TASKS.md'), 'Tasks')
    seedFile('CLAUDE.md', 'Project')

    expect(listSeeds(root).map((entry) => entry.target)).toEqual([
      join('.claude', 'TASKS.md'),
      'CLAUDE.md',
    ])
  })

  it('should return an empty list when no seeds directory exists', () => {
    expect(listSeeds(root)).toEqual([])
  })
})

describe('readSeedContents', () => {
  it('should attach each seed body and drop the absolute source path', async () => {
    seedFile(join('.claude', 'TASKS.md'), 'Tasks body')

    expect(await readSeedContents(listSeeds(root))).toEqual([
      {
        name: 'TASKS.md',
        source: join('tooling', 'claude', 'seeds', '.claude', 'TASKS.md'),
        target: join('.claude', 'TASKS.md'),
        content: 'Tasks body',
      },
    ])
  })
})
