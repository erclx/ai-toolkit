import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkItems,
  checkPlan,
  type Finding,
  type FindingKind,
  isRecordKind,
  readQuestions,
  type RecordKind,
  recordsDir,
  splitPlanSections,
  validateRecords,
} from '@/records/validate'

let ROOT: string

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-records-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

function kinds(findings: readonly Finding[]): FindingKind[] {
  return findings.map((found) => found.kind)
}

function conformingPlan(): string {
  return [
    '# Feature: A standard owns the plan format',
    '',
    'One paragraph on what is being built.',
    '',
    '## Summary',
    '',
    '- The goal',
    '',
    '## Files to touch',
    '',
    '- `standards/plan.md`: the sections and the answer contract',
    '',
    '## Risks',
    '',
    'None identified.',
    '',
    '## Questions',
    '',
    '1. Which check reaches a gitignored folder?',
    '   - Suggested: a validate verb, since it reports without writing',
    '   - Answer:',
    '',
  ].join('\n')
}

async function seedPlan(name: string, body: string): Promise<void> {
  const dir = recordsDir(ROOT, 'plans')
  mkdirSync(dir, { recursive: true })
  await writeFile(join(dir, name), body)
}

async function seedFolder(
  kind: Exclude<RecordKind, 'plans'>,
  slug: string,
  files: Readonly<Record<string, string>>,
): Promise<void> {
  const dir = join(recordsDir(ROOT, kind), slug)
  mkdirSync(dir, { recursive: true })

  await Promise.all(
    Object.entries(files).map(([name, body]) =>
      writeFile(join(dir, name), body),
    ),
  )
}

function frontmatter(fields: string): string {
  return ['---', fields, '---', '', '# Heading', ''].join('\n')
}

describe('isRecordKind', () => {
  it('should accept every published kind and reject anything else', () => {
    expect(isRecordKind('plans')).toBe(true)
    expect(isRecordKind('groundwork')).toBe(true)
    expect(isRecordKind('intake')).toBe(true)
    expect(isRecordKind('memory')).toBe(false)
  })
})

describe('splitPlanSections', () => {
  it('should key each section on its whole marker line', () => {
    const sections = splitPlanSections(conformingPlan())

    expect([...sections.keys()]).toEqual([
      '## Summary',
      '## Files to touch',
      '## Risks',
      '## Questions',
    ])
  })

  it('should not open a section on a deeper heading of the same name', () => {
    const sections = splitPlanSections(
      ['## Summary', '', '### Risks', '', '- nested', ''].join('\n'),
    )

    expect(sections.has('## Risks')).toBe(false)
  })
})

describe('readQuestions', () => {
  it('should collect a lettered sub-question as its own item', () => {
    const questions = readQuestions([
      '1. First',
      '   - Suggested: a',
      '   - Answer:',
      '1a. Second',
      '   - Suggested: b',
      '   - Answer:',
    ])

    expect(questions).toHaveLength(2)
    expect(questions[1].label).toBe('1a. Second')
  })
})

describe('checkPlan', () => {
  it('should report nothing on a conforming plan', () => {
    expect(checkPlan('feature-plan-standards.md', conformingPlan())).toEqual([])
  })

  it('should report a filename that is not feature-<slug>.md', () => {
    const findings = checkPlan('Plan For Standards.md', conformingPlan())

    expect(kinds(findings)).toEqual(['name-malformed'])
  })

  it('should report a missing required section', () => {
    const body = conformingPlan().replace('## Risks\n\nNone identified.\n', '')
    const findings = checkPlan('feature-a-b.md', body)

    expect(kinds(findings)).toEqual(['section-missing'])
    expect(findings[0].subject).toBe('## Risks')
  })

  it('should report a missing Feature heading', () => {
    const body = conformingPlan().replace(
      '# Feature: A standard owns the plan format',
      '# A standard owns the plan format',
    )

    expect(kinds(checkPlan('feature-a-b.md', body))).toEqual(['title-missing'])
  })

  it('should report a question carrying no suggestion', () => {
    const body = conformingPlan().replace(
      '   - Suggested: a validate verb, since it reports without writing\n',
      '',
    )

    expect(kinds(checkPlan('feature-a-b.md', body))).toEqual([
      'suggestion-missing',
    ])
  })

  it('should report a question carrying no answer slot', () => {
    const body = conformingPlan().replace('   - Answer:\n', '')

    expect(kinds(checkPlan('feature-a-b.md', body))).toEqual([
      'question-unanswerable',
    ])
  })

  it('should accept None identified in place of the question list', () => {
    const body = conformingPlan().replace(
      [
        '1. Which check reaches a gitignored folder?',
        '   - Suggested: a validate verb, since it reports without writing',
        '   - Answer:',
      ].join('\n'),
      'None identified.',
    )

    expect(checkPlan('feature-a-b.md', body)).toEqual([])
  })

  it('should report a files-to-touch entry with no reason', () => {
    const body = conformingPlan().replace(
      '- `standards/plan.md`: the sections and the answer contract',
      '- `standards/plan.md`',
    )

    expect(kinds(checkPlan('feature-a-b.md', body))).toEqual([
      'entry-unreasoned',
    ])
  })
})

describe('checkItems', () => {
  const item = [
    '### 1. The format sits in three places',
    '',
    '- **Problem:** three surfaces state it',
    '- **Fix:** one standard owns it',
    '- **Worth it:** yes',
    '- **You:**',
    '',
  ].join('\n')

  it('should report nothing on an item carrying all four bullets', () => {
    expect(checkItems('dump', '01-standards.md', item)).toEqual([])
  })

  it('should name every missing bullet in one finding', () => {
    const body = item
      .replace('- **Fix:** one standard owns it\n', '')
      .replace('- **You:**\n', '')
    const findings = checkItems('dump', '01-standards.md', body)

    expect(kinds(findings)).toEqual(['item-incomplete'])
    expect(findings[0].message).toBe('states no Fix, no You.')
  })

  it('should report an open question carrying no suggestion', () => {
    const body = item.replace(
      '- **You:**',
      '- **Open:** which folder\n- **You:**',
    )

    expect(kinds(checkItems('dump', '01-standards.md', body))).toEqual([
      'suggestion-missing',
    ])
  })
})

describe('validateRecords', () => {
  it('should refuse when the folder does not exist', async () => {
    const outcome = await validateRecords(ROOT, 'plans')

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.reason).toBe('no-folder')
  })

  it('should report a clean folder of conforming plans', async () => {
    await seedPlan('feature-plan-standards.md', conformingPlan())
    const outcome = await validateRecords(ROOT, 'plans')

    expect(outcome).toMatchObject({ ok: true, records: 1, findings: [] })
  })

  it('should carry the record name on every plan finding', async () => {
    await seedPlan('feature-broken.md', '# Broken\n')
    const outcome = await validateRecords(ROOT, 'plans')

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(
      outcome.findings.every((f) => f.record === 'feature-broken.md'),
    ).toBe(true)
  })

  it('should report a groundwork track missing its README and state file', async () => {
    await seedFolder('groundwork', 'skew', {
      '02-topic.md': frontmatter('title: Topic\ndescription: One line'),
    })
    const outcome = await validateRecords(ROOT, 'groundwork')

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(kinds(outcome.findings)).toEqual(['index-missing', 'state-missing'])
  })

  it('should report a track holding a decision with no handoff', async () => {
    await seedFolder('groundwork', 'skew', {
      'README.md': frontmatter(
        'title: Skew\ndescription: One line\ndate: 2026-08-04',
      ),
      '01-current-state.md': frontmatter('title: State\ndescription: One line'),
      '06-decision.md': frontmatter('title: Decision\ndescription: One line'),
    })
    const outcome = await validateRecords(ROOT, 'groundwork')

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(kinds(outcome.findings)).toEqual(['closing-partial'])
  })

  it('should report nothing on a closed conforming track', async () => {
    await seedFolder('groundwork', 'skew', {
      'README.md': frontmatter(
        'title: Skew\ndescription: One line\ndate: 2026-08-04',
      ),
      '01-current-state.md': frontmatter('title: State\ndescription: One line'),
      '06-decision.md': frontmatter('title: Decision\ndescription: One line'),
      '07-next-session.md': frontmatter(
        'title: Handoff\ndescription: One line',
      ),
    })

    expect(await validateRecords(ROOT, 'groundwork')).toMatchObject({
      ok: true,
      records: 1,
      findings: [],
    })
  })

  it('should report an index file carrying no opening date', async () => {
    await seedFolder('groundwork', 'skew', {
      'README.md': frontmatter('title: Skew\ndescription: One line'),
      '01-current-state.md': frontmatter('title: State\ndescription: One line'),
    })
    const outcome = await validateRecords(ROOT, 'groundwork')

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(kinds(outcome.findings)).toEqual(['date-malformed'])
  })

  it('should report a file missing frontmatter fields', async () => {
    await seedFolder('groundwork', 'skew', {
      'README.md': frontmatter(
        'title: Skew\ndescription: One line\ndate: 2026-08-04',
      ),
      '01-current-state.md': '# State\n',
    })
    const outcome = await validateRecords(ROOT, 'groundwork')

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.findings[0]).toMatchObject({
      kind: 'frontmatter-incomplete',
      message: 'carries no title and no description.',
    })
  })

  it('should skip the item check on the intake handoff file', async () => {
    await seedFolder('intake', 'overview', {
      '00-overview.md': frontmatter(
        'title: Dump\ndescription: One line\ndate: 2026-08-04',
      ),
      '99-next-session.md': [
        '---',
        'title: Handoff',
        'description: One line',
        '---',
        '',
        '### A heading that is not an item',
        '',
      ].join('\n'),
    })

    expect(await validateRecords(ROOT, 'intake')).toMatchObject({
      ok: true,
      findings: [],
    })
  })

  it('should report a malformed item inside an intake cluster', async () => {
    await seedFolder('intake', 'overview', {
      '00-overview.md': frontmatter(
        'title: Dump\ndescription: One line\ndate: 2026-08-04',
      ),
      '01-standards.md': [
        '---',
        'title: Standards',
        'description: One line',
        '---',
        '',
        '### 1. The format sits in three places',
        '',
        '- **Problem:** three surfaces state it',
        '',
      ].join('\n'),
    })
    const outcome = await validateRecords(ROOT, 'intake')

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.findings[0]).toMatchObject({
      kind: 'item-incomplete',
      record: 'overview',
    })
  })

  it('should count folders rather than the files inside them', async () => {
    await seedFolder('intake', 'first', {
      '00-overview.md': frontmatter(
        'title: One\ndescription: One line\ndate: 2026-08-04',
      ),
    })
    await seedFolder('intake', 'second', {
      '00-overview.md': frontmatter(
        'title: Two\ndescription: One line\ndate: 2026-08-04',
      ),
    })
    const outcome = await validateRecords(ROOT, 'intake')

    expect(outcome).toMatchObject({ ok: true, records: 2, findings: [] })
  })
})
