import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildModel,
  loadCatalog,
  measureCases,
  type RankedSkill,
  scanRank,
} from '@/claude/skills-rank'

let root: string

function writeSkill(name: string, description: string): void {
  const path = join(root, 'claude', 'skills', name, 'SKILL.md')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    ['---', `name: ${name}`, `description: ${description}`, '---', ''].join(
      '\n',
    ),
  )
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'aitk-skills-rank-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('loadCatalog', () => {
  it('should read every skill folder carrying a frontmatter description', () => {
    writeSkill('alpha', 'Handles alpha requests for the alpha subsystem.')
    writeSkill('beta', 'Handles beta requests for the beta subsystem.')

    expect(loadCatalog(root)).toEqual([
      {
        name: 'alpha',
        description: 'Handles alpha requests for the alpha subsystem.',
      },
      {
        name: 'beta',
        description: 'Handles beta requests for the beta subsystem.',
      },
    ])
  })

  it('should return an empty catalog when claude/skills does not exist', () => {
    expect(loadCatalog(root)).toEqual([])
  })
})

const FIXTURE: readonly RankedSkill[] = [
  {
    name: 'git-branch',
    description:
      'Generates and validates conventional git branch names for a repository.',
  },
  {
    name: 'git-commit',
    description:
      'Generates one conventional commit message from staged changes.',
  },
  {
    name: 'bash-script',
    description:
      'Generates interactive bash scripts with a visual timeline and prompts.',
  },
  {
    name: 'cli-script',
    description:
      'Generates non-interactive automation scripts for CI and pipelines.',
  },
]

describe('buildModel', () => {
  it('should rank the skill sharing the most vocabulary with the prompt first', () => {
    const model = buildModel(FIXTURE)

    const ranked = model.rank('rename my git branch to something conventional')

    expect(ranked[0]?.name).toBe('git-branch')
  })

  it('should break a tied score alphabetically for a determinate order', () => {
    const model = buildModel([
      { name: 'zeta', description: 'shared words here' },
      { name: 'alpha', description: 'shared words here' },
    ])

    const ranked = model.rank('shared words here')

    expect(ranked.map((entry) => entry.name)).toEqual(['alpha', 'zeta'])
  })
})

describe('measureCases', () => {
  it('should count a case whose prompt ranks its expected skill first', () => {
    const result = measureCases(FIXTURE, [
      {
        prompt: 'rename this branch to a conventional name',
        expect: 'git-branch',
      },
      {
        prompt: 'write one commit message for what is staged',
        expect: 'git-commit',
      },
    ])

    expect(result.rank1).toBe(2)
    expect(result.top3).toBe(2)
    expect(result.misses).toEqual([])
  })

  it('should report a miss with the skill that won instead', () => {
    const result = measureCases(FIXTURE, [
      {
        prompt: 'write me an automation pipeline script',
        expect: 'bash-script',
      },
    ])

    expect(result.rank1).toBe(0)
    expect(result.misses).toEqual([
      {
        prompt: 'write me an automation pipeline script',
        expect: 'bash-script',
        won: 'cli-script',
        rank: 2,
      },
    ])
  })

  it('should report rank 0 when the expected skill is not in the catalog', () => {
    const result = measureCases(FIXTURE, [
      { prompt: 'anything at all', expect: 'not-a-real-skill' },
    ])

    expect(result.misses).toEqual([
      {
        prompt: 'anything at all',
        expect: 'not-a-real-skill',
        won: expect.any(String),
        rank: 0,
      },
    ])
  })
})

describe('scanRank', () => {
  it('should measure the corpus against the catalog on disk', () => {
    writeSkill('git-branch', FIXTURE[0].description)
    writeSkill('git-commit', FIXTURE[1].description)

    const report = scanRank(root, [
      {
        prompt: 'rename this branch to a conventional name',
        expect: 'git-branch',
      },
    ])

    if (report.kind !== 'measured') throw new Error('expected a measurement')
    expect(report.skills).toBe(2)
    expect(report.cases).toBe(1)
    expect(report.rank1).toBe(1)
  })

  it('should refuse when the catalog is not on disk', () => {
    expect(scanRank(root, [])).toEqual({ kind: 'refused', reason: 'no-skills' })
  })
})
