import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type AnswersOutcome, planAnswers, planPath } from '@/tasks/answers'

let ROOT: string

interface QuestionFixture {
  readonly suggested: string
  readonly answer?: string
}

function planBody(questions: readonly QuestionFixture[]): string {
  const block = questions.flatMap(({ suggested, answer = '' }, index) => [
    `${index + 1}. Question ${index + 1}?`,
    `   - Suggested: ${suggested}`,
    `   - Answer:${answer ? ` ${answer}` : ''}`,
  ])

  return [
    '# Feature: A plan under test',
    '',
    '## Summary',
    '',
    '- It ships something.',
    '',
    '**Files to touch:**',
    '',
    '- `src/a.ts`: the thing.',
    '',
    '**Questions:**',
    '',
    ...block,
    '',
  ].join('\n')
}

async function writePlan(
  slug: string,
  questions: readonly QuestionFixture[],
): Promise<void> {
  await writeFile(
    join(ROOT, '.claude', 'plans', `feature-${slug}.md`),
    planBody(questions),
    'utf8',
  )
}

function assertOk(
  outcome: AnswersOutcome,
): asserts outcome is Extract<AnswersOutcome, { ok: true }> {
  expect(outcome.ok).toBe(true)
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'answers-'))
  mkdirSync(join(ROOT, '.claude', 'plans'), { recursive: true })
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('planAnswers', () => {
  it('should hold a plan whose operator call still has an empty answer slot', async () => {
    await writePlan('gate', [
      { suggested: 'needs your call, the two shapes cost the same.' },
    ])

    const outcome = await planAnswers(ROOT, 'gate')

    assertOk(outcome)
    expect(outcome.launchable).toBe(false)
    expect(outcome.open).toHaveLength(1)
  })

  it('should launch the same plan once the operator has filled the slot', async () => {
    await writePlan('gate', [
      {
        suggested: 'needs your call, the two shapes cost the same.',
        answer: 'Take the second.',
      },
    ])

    const outcome = await planAnswers(ROOT, 'gate')

    assertOk(outcome)
    expect(outcome.launchable).toBe(true)
    expect(outcome.open).toEqual([])
  })

  it('should name the question and the reason rather than report a count', async () => {
    await writePlan('gate', [
      {
        suggested: 'needs your call, it turns on how loud you want the report.',
      },
    ])

    const outcome = await planAnswers(ROOT, 'gate')

    assertOk(outcome)
    expect(outcome.open[0]?.label).toBe('1. Question 1?')
    expect(outcome.open[0]?.why).toBe(
      'it turns on how loud you want the report.',
    )
  })

  it('should strip a full stop as well as a comma from in front of the reason', async () => {
    await writePlan('gate', [
      { suggested: 'needs your call. Retiring is also defensible.' },
    ])

    const outcome = await planAnswers(ROOT, 'gate')

    assertOk(outcome)
    expect(outcome.open[0]?.why).toBe('Retiring is also defensible.')
  })

  it('should launch a plan whose blank slots sit under ordinary suggestions', async () => {
    await writePlan('gate', [
      { suggested: 'the first, since the group already carries a verb.' },
      { suggested: 'the verb, since a rule the model talks past is not one.' },
    ])

    const outcome = await planAnswers(ROOT, 'gate')

    assertOk(outcome)
    expect(outcome.launchable).toBe(true)
  })

  it('should report every open call when a plan carries more than one', async () => {
    await writePlan('gate', [
      { suggested: 'needs your call, the first.' },
      { suggested: 'a technical default settles it.' },
      { suggested: 'needs your call, the third.' },
    ])

    const outcome = await planAnswers(ROOT, 'gate')

    assertOk(outcome)
    expect(outcome.open.map(({ label }) => label)).toEqual([
      '1. Question 1?',
      '3. Question 3?',
    ])
  })

  it('should read an operator call the author capitalized', async () => {
    await writePlan('gate', [
      { suggested: 'Needs your call, the standard writes it lowercase.' },
    ])

    const outcome = await planAnswers(ROOT, 'gate')

    assertOk(outcome)
    expect(outcome.launchable).toBe(false)
  })

  it('should launch a plan carrying no questions section at all', async () => {
    await writeFile(
      join(ROOT, '.claude', 'plans', 'feature-bare.md'),
      [
        '# Feature: Bare',
        '',
        '**Files to touch:**',
        '',
        '- `src/a.ts`: it.',
        '',
      ].join('\n'),
      'utf8',
    )

    const outcome = await planAnswers(ROOT, 'bare')

    assertOk(outcome)
    expect(outcome.launchable).toBe(true)
  })

  it('should refuse a reference that resolves to no file', async () => {
    const outcome = await planAnswers(ROOT, 'absent')

    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.reason).toBe('no-plan')
  })

  it('should refuse an empty reference as bad input rather than as a missing plan', async () => {
    const outcome = await planAnswers(ROOT, '  ')

    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.reason).toBe('bad-input')
  })

  it('should read a plan named by path as well as by slug', async () => {
    await writePlan('gate', [{ suggested: 'needs your call, either.' }])

    const outcome = await planAnswers(ROOT, '.claude/plans/feature-gate.md')

    assertOk(outcome)
    expect(outcome.plan).toBe(join('.claude', 'plans', 'feature-gate.md'))
  })
})

describe('planPath', () => {
  it('should add the folder, the prefix, and the extension to a bare slug', () => {
    expect(planPath('/root', 'gate')).toBe(
      join('/root', '.claude', 'plans', 'feature-gate.md'),
    )
  })

  it('should not repeat a prefix the caller already spelled', () => {
    expect(planPath('/root', 'feature-gate')).toBe(
      join('/root', '.claude', 'plans', 'feature-gate.md'),
    )
  })

  it('should take a relative path from the root it was given', () => {
    expect(planPath('/root', '.claude/plans/archive/feature-gate.md')).toBe(
      join('/root', '.claude', 'plans', 'archive', 'feature-gate.md'),
    )
  })

  it('should leave an absolute path as the caller wrote it', () => {
    expect(planPath('/root', '/elsewhere/feature-gate.md')).toBe(
      '/elsewhere/feature-gate.md',
    )
  })
})
