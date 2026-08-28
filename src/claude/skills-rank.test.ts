import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildModel,
  loadCaseCorpus,
  loadCatalog,
  measureCases,
  type RankedSkill,
  scanRank,
} from '@/claude/skills-rank'

let root: string

function writeSkillIn(corpus: string, name: string, description: string): void {
  const path = join(root, corpus, 'skills', name, 'SKILL.md')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    ['---', `name: ${name}`, `description: ${description}`, '---', ''].join(
      '\n',
    ),
  )
}

function writeSkill(name: string, description: string): void {
  writeSkillIn('claude', name, description)
}

/** A project that wrote its own skills and never shipped a plugin corpus. */
function writeTargetSkill(name: string, description: string): void {
  writeSkillIn('.claude', name, description)
}

function writeCases(name: string, text: string): string {
  const path = join(root, name)
  writeFileSync(path, text)
  return path
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

  it("should read a target's own corpus when no shipped tree is present", () => {
    writeTargetSkill('alpha', 'Handles alpha requests for the alpha subsystem.')

    expect(loadCatalog(root)).toEqual([
      {
        name: 'alpha',
        description: 'Handles alpha requests for the alpha subsystem.',
      },
    ])
  })

  it('should prefer the shipped corpus over the internal one', () => {
    writeSkill('shipped', 'The tree that installs into a target.')
    writeTargetSkill('internal', 'The tree that never leaves this repository.')

    expect(loadCatalog(root).map((skill) => skill.name)).toEqual(['shipped'])
  })

  it('should return an empty catalog when neither corpus exists', () => {
    expect(loadCatalog(root)).toEqual([])
  })
})

describe('loadCaseCorpus', () => {
  it('should read a JSON array of prompt and expect pairs', () => {
    const path = writeCases(
      'cases.json',
      JSON.stringify([{ prompt: 'name this branch', expect: 'git-branch' }]),
    )

    expect(loadCaseCorpus(path)).toEqual({
      kind: 'cases',
      cases: [{ prompt: 'name this branch', expect: 'git-branch' }],
    })
  })

  it('should refuse a path holding no file', () => {
    const path = join(root, 'absent.json')

    expect(loadCaseCorpus(path)).toEqual({
      kind: 'refused',
      reason: 'no-cases',
      detail: path,
    })
  })

  it('should refuse a file that is not JSON at all', () => {
    const path = writeCases('broken.json', 'not json')

    const report = loadCaseCorpus(path)

    expect(report.kind).toBe('refused')
    if (report.kind !== 'refused') throw new Error('expected a refusal')
    expect(report.reason).toBe('bad-cases')
  })

  it('should name the case whose fields are not both strings', () => {
    const path = writeCases(
      'shape.json',
      JSON.stringify([
        { prompt: 'fine', expect: 'git-branch' },
        { prompt: 'missing an expect' },
      ]),
    )

    expect(loadCaseCorpus(path)).toEqual({
      kind: 'refused',
      reason: 'bad-cases',
      detail: 'case 1 carries no string prompt and expect',
    })
  })

  it('should refuse an empty corpus rather than scoring it a clean pass', () => {
    const path = writeCases('empty.json', '[]')

    expect(loadCaseCorpus(path)).toEqual({
      kind: 'refused',
      reason: 'bad-cases',
      detail: 'the file holds no cases at all',
    })
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

  it('should return no ranking for a prompt that tokenizes to nothing', () => {
    const model = buildModel(FIXTURE)

    expect(model.rank('is it so')).toEqual([])
    expect(model.rank('why is it')).toEqual([])
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

  it('should mark a case unmeasurable rather than crediting it a false rank one', () => {
    const skillCase = { prompt: 'is it so', expect: 'bash-script' }
    const result = measureCases(FIXTURE, [skillCase])

    expect(result.rank1).toBe(0)
    expect(result.top3).toBe(0)
    expect(result.misses).toEqual([])
    expect(result.unmeasurable).toEqual([skillCase])
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

  it("should measure a target's own corpus and name which one it read", () => {
    writeTargetSkill('git-branch', FIXTURE[0].description)

    const report = scanRank(root, [
      {
        prompt: 'rename this branch to a conventional name',
        expect: 'git-branch',
      },
    ])

    if (report.kind !== 'measured') throw new Error('expected a measurement')
    expect(report.corpus).toBe('.claude/skills')
    expect(report.skills).toBe(1)
    expect(report.rank1).toBe(1)
  })

  it('should refuse when neither corpus is on disk', () => {
    expect(scanRank(root, [])).toEqual({ kind: 'refused', reason: 'no-skills' })
  })
})
