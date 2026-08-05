import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { linesOutsideFences } from '@/markdown/scan'
import {
  checkItems,
  checkMemory,
  checkPlan,
  type Finding,
  type FindingKind,
  isRecordKind,
  readQuestions,
  type RecordKind,
  recordsDir,
  preferredMarker,
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
    '**Files to touch:**',
    '',
    '- `standards/plan.md`: the sections and the answer contract',
    '',
    '**Risks:**',
    '',
    'None identified.',
    '',
    '**Questions:**',
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
    expect(isRecordKind('memory')).toBe(true)
    expect(isRecordKind('review')).toBe(false)
  })
})

describe('splitPlanSections', () => {
  it('should key each section on its whole marker line', () => {
    const sections = splitPlanSections(conformingPlan())

    expect([...sections.keys()]).toEqual([
      'Summary',
      'Files to touch',
      'Risks',
      'Questions',
    ])
  })

  it('should key the heading and bold spellings to one section', () => {
    const bold = splitPlanSections('**Risks:**\n\n- one\n')
    const heading = splitPlanSections('## Risks\n\n- one\n')

    expect([...bold.keys()]).toEqual(['Risks'])
    expect([...heading.keys()]).toEqual(['Risks'])
  })

  it('should close a section on a label it does not recognize', () => {
    const sections = splitPlanSections(
      [
        '**Files to touch:**',
        '',
        '- `a.ts`: a reason',
        '',
        '**Decisions to record:**',
        '',
        '- a bullet that belongs to no section',
        '',
      ].join('\n'),
    )

    expect(sections.get('Files to touch')).toEqual([
      '',
      '- `a.ts`: a reason',
      '',
    ])
  })

  it('should not open a section on a deeper heading of the same name', () => {
    const sections = splitPlanSections(
      ['## Summary', '', '### Risks', '', '- nested', ''].join('\n'),
    )

    expect(sections.has('Risks')).toBe(false)
  })

  it('should not open a section on a bold phrase inside a bullet', () => {
    const sections = splitPlanSections(
      ['## Summary', '', '- carries a **Risks:** mention inline', ''].join(
        '\n',
      ),
    )

    expect(sections.has('Risks')).toBe(false)
  })
})

describe('linesOutsideFences', () => {
  it('should drop a fenced block and keep what surrounds it', () => {
    const kept = linesOutsideFences(
      ['before', '```markdown', '- `a.ts`', '```', 'after'].join('\n'),
    )

    expect(kept).toEqual(['before', 'after'])
  })

  it('should not close a longer fence on a shorter one inside it', () => {
    const kept = linesOutsideFences(
      ['````markdown', '```md', 'inner', '```', '````', 'after'].join('\n'),
    )

    expect(kept).toEqual(['after'])
  })
})

describe('preferredMarker', () => {
  it('should name Summary as a heading and the rest as bold labels', () => {
    expect(preferredMarker('Summary')).toBe('## Summary')
    expect(preferredMarker('Files to touch')).toBe('**Files to touch:**')
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
    const body = conformingPlan().replace(
      '**Risks:**\n\nNone identified.\n',
      '',
    )
    const findings = checkPlan('feature-a-b.md', body)

    expect(kinds(findings)).toEqual(['section-missing'])
    expect(findings[0].subject).toBe('**Risks:**')
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

  it('should accept an entry naming two files before one shared reason', () => {
    const body = conformingPlan().replace(
      '- `standards/plan.md`: the sections and the answer contract',
      '- `a/SKILL.md` and `b/SKILL.md`: the same citation',
    )

    expect(checkPlan('feature-a-b.md', body)).toEqual([])
  })

  it('should accept a reason carrying the path rather than leading with it', () => {
    const body = conformingPlan().replace(
      '- `standards/plan.md`: the sections and the answer contract',
      '- Context assembly: the tier table in `.claude/context/model.md`',
    )

    expect(checkPlan('feature-a-b.md', body)).toEqual([])
  })

  it('should accept a terse numeric annotation as a reason', () => {
    const body = conformingPlan().replace(
      '- `standards/plan.md`: the sections and the answer contract',
      '- `standards/plan.md`: 73',
    )

    expect(checkPlan('feature-a-b.md', body)).toEqual([])
  })

  it('should not report bullets under a label the plan invented', () => {
    const body = conformingPlan().replace(
      '- `standards/plan.md`: the sections and the answer contract',
      [
        '- `standards/plan.md`: the sections and the answer contract',
        '',
        '**Decisions to record:**',
        '',
        '- Two delivery paths, copy through the CLI and load through the plugin',
      ].join('\n'),
    )

    expect(checkPlan('feature-a-b.md', body)).toEqual([])
  })

  it('should not report bullets inside a fenced example', () => {
    const body = conformingPlan().replace(
      '- `standards/plan.md`: the sections and the answer contract',
      [
        '- `standards/plan.md`: the sections and the answer contract',
        '',
        '```markdown',
        '- Outcome: what will be true when this is done',
        '- Silence is agreement',
        '```',
      ].join('\n'),
    )

    expect(checkPlan('feature-a-b.md', body)).toEqual([])
  })

  it('should report an entry naming a file and saying nothing about it', () => {
    const body = conformingPlan().replace(
      '- `standards/plan.md`: the sections and the answer contract',
      '- `standards/plan.md`',
    )

    expect(kinds(checkPlan('feature-a-b.md', body))).toEqual([
      'entry-unreasoned',
    ])
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

describe('checkMemory', () => {
  function entry(fields: string, body: string): string {
    return ['---', fields, '---', '', body, ''].join('\n')
  }

  const RULE = [
    'Name the wrong run a bounding key would catch before declaring it.',
    '',
    '**Why:** The widest glob admitting a correct run was `**`, so the count no',
    'wrong run could have moved read green.',
    '',
    '**How to apply:** When no wrong run falls outside the key, the honest form',
    'is its absence plus a stated reason. See [[project-declaration-binds]].',
  ].join('\n')

  const FIELDS = [
    'title: Name the wrong run a bounding key would catch',
    'description: Omit a key whose only passing value admits the whole tree',
    'category: Project',
  ].join('\n')

  it('should report nothing on a conforming project entry', () => {
    expect(checkMemory('project-scope-glob.md', entry(FIELDS, RULE))).toEqual(
      [],
    )
  })

  it('should report nothing on a body running the three parts together', () => {
    const body = RULE.split('\n')
      .filter((line) => line.trim().length > 0)
      .join('\n')

    expect(checkMemory('project-scope-glob.md', entry(FIELDS, body))).toEqual(
      [],
    )
  })

  it('should report a filename prefix outside the four types', () => {
    const findings = checkMemory('verify-scope-glob.md', entry(FIELDS, RULE))

    expect(kinds(findings)).toEqual(['name-malformed'])
  })

  it('should not report a category mismatch on top of a malformed name', () => {
    const findings = checkMemory('verify-scope-glob.md', entry(FIELDS, RULE))

    expect(kinds(findings)).not.toContain('category-mismatch')
  })

  it('should report a category disagreeing with the filename prefix', () => {
    const fields = FIELDS.replace('category: Project', 'category: Feedback')
    const findings = checkMemory('project-scope-glob.md', entry(fields, RULE))

    expect(kinds(findings)).toEqual(['category-mismatch'])
    expect(findings[0].message).toBe(
      'is not Project, which the filename prefix declares.',
    )
  })

  it('should report a category carrying the wrong casing', () => {
    const fields = FIELDS.replace('category: Project', 'category: project')
    const findings = checkMemory('project-scope-glob.md', entry(fields, RULE))

    expect(kinds(findings)).toEqual(['category-mismatch'])
  })

  it('should name every missing frontmatter field in one finding', () => {
    const fields = 'title: Name the wrong run a bounding key would catch'
    const findings = checkMemory('project-scope-glob.md', entry(fields, RULE))

    expect(findings[0]).toMatchObject({
      kind: 'frontmatter-incomplete',
      message: 'carries no description and no category.',
    })
  })

  it('should report a title repeating the filename stem', () => {
    const fields = FIELDS.replace(
      'title: Name the wrong run a bounding key would catch',
      'title: project-scope-glob',
    )
    const findings = checkMemory('project-scope-glob.md', entry(fields, RULE))

    expect(kinds(findings)).toEqual(['title-is-slug'])
  })

  it('should report a rule-bearing body carrying no How to apply line', () => {
    const body = RULE.split('\n\n').slice(0, 2).join('\n\n')
    const findings = checkMemory('project-scope-glob.md', entry(FIELDS, body))

    expect(kinds(findings)).toEqual(['section-missing'])
    expect(findings[0].subject).toBe('**How to apply:**')
  })

  it('should report a body opening with a marker rather than a rule', () => {
    const body = RULE.split('\n\n').slice(1).join('\n\n')
    const findings = checkMemory('project-scope-glob.md', entry(FIELDS, body))

    expect(findings[0]).toMatchObject({
      kind: 'section-missing',
      subject: 'the rule line',
    })
  })

  it('should not require the markers on a reference entry', () => {
    const fields = [
      'title: Diction is a live target project',
      'description: The repo whose real use surfaces toolkit gaps',
      'category: Reference',
    ].join('\n')
    const body = 'The `diction` repo is a react and python target project.'

    expect(checkMemory('reference-diction.md', entry(fields, body))).toEqual([])
  })

  it('should not read a marker inside a fenced block as the body shape', () => {
    const body = [
      'Name the wrong run a bounding key would catch before declaring it.',
      '',
      '```markdown',
      '**Why:** the template a session copies',
      '**How to apply:** the template a session copies',
      '```',
    ].join('\n')
    const findings = checkMemory('project-scope-glob.md', entry(FIELDS, body))

    expect(kinds(findings)).toEqual(['section-missing', 'section-missing'])
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

  it('should skip the generated catalog when counting memory entries', async () => {
    const dir = recordsDir(ROOT, 'memory')
    mkdirSync(dir, { recursive: true })
    await writeFile(
      join(dir, 'index.md'),
      frontmatter('title: Memory\nsubtitle: One line'),
    )
    await writeFile(
      join(dir, 'feedback-answer-first.md'),
      [
        '---',
        'title: Close with an answer',
        'description: State the pick before the reasoning',
        'category: Feedback',
        '---',
        '',
        'Close with answers and a recommendation, never a list of questions.',
        '',
        '**Why:** Two handoffs this session returned open questions.',
        '',
        '**How to apply:** State the pick first, then the reason.',
        '',
      ].join('\n'),
    )

    expect(await validateRecords(ROOT, 'memory')).toMatchObject({
      ok: true,
      records: 1,
      findings: [],
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
