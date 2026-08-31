import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  archiveDir,
  archiveTask,
  planCitations,
  readOutcomes,
  readPlanTarget,
  readPullRequest,
  removePriorityRow,
  tasksDir,
} from '@/tasks/archive'

let ROOT: string

const INDEX_SEED = `---
title: Tasks
subtitle: One file per task, ordered by phase label
---

# Tasks

One file per task, ordered by phase label
`

interface TaskFixture {
  readonly stem?: string
  readonly pullRequest?: number
  readonly plan?: string
  readonly outcomes?: string
}

function taskBody({
  pullRequest,
  plan,
  outcomes = '- [x] Outcome: it shipped',
}: TaskFixture): string {
  const lines = [
    '---',
    "title: 'v28.1: A task'",
    'description: One line on what this task achieves',
    '---',
    '',
    '# v28.1: A task',
    '',
  ]

  if (plan) lines.push(`Plan: [${plan}](${plan})`)
  if (pullRequest) lines.push(`Pull request: #${pullRequest}`)

  lines.push(
    '',
    '## Outcomes',
    '',
    outcomes,
    '',
    '## Findings',
    '',
    '- A note.',
  )

  return `${lines.join('\n')}\n`
}

async function seedTask(fixture: TaskFixture = {}): Promise<string> {
  const stem = fixture.stem ?? 'v28.1-trigger-escalation'
  const dir = tasksDir(ROOT)
  mkdirSync(dir, { recursive: true })
  await writeFile(join(dir, 'index.md'), INDEX_SEED)
  await writeFile(join(dir, `${stem}.md`), taskBody(fixture))
  return stem
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'canon-tasks-archive-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('readOutcomes', () => {
  it('should split outcomes by checkbox state', () => {
    const text = '- [x] Outcome: shipped\n- [ ] Outcome: pending\n'

    expect(readOutcomes(text)).toEqual({
      open: ['Outcome: pending'],
      closed: ['Outcome: shipped'],
    })
  })

  it('should ignore bullets that carry no checkbox', () => {
    expect(readOutcomes('- A finding, not an outcome\n')).toEqual({
      open: [],
      closed: [],
    })
  })

  it('should treat an uppercase mark as closed', () => {
    expect(readOutcomes('- [X] Outcome: shipped\n').closed).toEqual([
      'Outcome: shipped',
    ])
  })

  it('should ignore a checkbox inside a fenced block', () => {
    const text =
      '```markdown\n- [ ] Outcome: a sample\n```\n- [x] Outcome: real\n'

    expect(readOutcomes(text)).toEqual({
      open: [],
      closed: ['Outcome: real'],
    })
  })
})

describe('readPullRequest', () => {
  it('should read the number from the pull request line', () => {
    expect(readPullRequest('Pull request: #673\n')).toBe(673)
  })

  it('should return undefined when the line is absent', () => {
    expect(readPullRequest('Issue: #12\n')).toBeUndefined()
  })

  it('should not read a number out of prose naming a pull request', () => {
    expect(readPullRequest('Split from #646, which shipped.\n')).toBeUndefined()
  })
})

describe('readPlanTarget', () => {
  it('should read the target out of a markdown link', () => {
    expect(readPlanTarget('Plan: [feature-x](../plans/feature-x.md)\n')).toBe(
      '../plans/feature-x.md',
    )
  })

  it('should read the older bare path form', () => {
    expect(readPlanTarget('Plan: ../plans/feature-x.md\n')).toBe(
      '../plans/feature-x.md',
    )
  })

  it('should return undefined when there is no plan line', () => {
    expect(readPlanTarget('Issue: #12\n')).toBeUndefined()
  })
})

describe('removePriorityRow', () => {
  it('should drop the row linking to the archived task', () => {
    const text = [
      '| Task | Touches |',
      '| ---- | ------- |',
      '| [v28.1 escalation](v28.1-trigger-escalation.md) | `src/tasks/` |',
      '| [v32.1 globs](v32.1-sync-glob-narrowing.md) | `scripts/` |',
    ].join('\n')

    const result = removePriorityRow(text, 'v28.1-trigger-escalation')

    expect(result.removed).toBe(true)
    expect(result.text).not.toContain('v28.1-trigger-escalation.md')
    expect(result.text).toContain('v32.1-sync-glob-narrowing.md')
  })

  it('should leave prose naming the task untouched', () => {
    const text = 'The v28.1-trigger-escalation.md track runs first.'

    expect(removePriorityRow(text, 'v28.1-trigger-escalation')).toEqual({
      text,
      removed: false,
    })
  })

  it('should report nothing removed when no row matches', () => {
    const text = '| [v32.1 globs](v32.1-sync-glob-narrowing.md) | `scripts/` |'

    expect(removePriorityRow(text, 'v28.1-trigger-escalation').removed).toBe(
      false,
    )
  })

  it('should keep a row that only names the task as a blocker', () => {
    const text = [
      '| [v28.1 escalation](v28.1-trigger-escalation.md) | `src/tasks/` |',
      '| [v17.4 roadmap](v17.4-roadmap-lifecycle-gate.md) | waits on [v28.1](v28.1-trigger-escalation.md) |',
    ].join('\n')

    const result = removePriorityRow(text, 'v28.1-trigger-escalation')

    expect(result.text).toContain('v17.4-roadmap-lifecycle-gate.md')
    expect(result.text).not.toContain('| [v28.1 escalation]')
  })
})

describe('archiveTask', () => {
  it('should move a closed task into the archive', async () => {
    const stem = await seedTask()

    const result = await archiveTask(ROOT, { kind: 'stem', stem })

    expect(result.ok).toBe(true)
    expect(existsSync(join(tasksDir(ROOT), `${stem}.md`))).toBe(false)
    expect(existsSync(join(archiveDir(ROOT), `${stem}.md`))).toBe(true)
  })

  it('should refuse a task carrying an open outcome', async () => {
    const stem = await seedTask({
      outcomes: '- [x] Outcome: shipped\n- [ ] Outcome: pending',
    })

    const result = await archiveTask(ROOT, { kind: 'stem', stem })

    expect(result).toMatchObject({
      ok: false,
      reason: 'open-outcomes',
      detail: ['Outcome: pending'],
    })
    expect(existsSync(join(tasksDir(ROOT), `${stem}.md`))).toBe(true)
  })

  it('should refuse a task carrying no outcomes at all', async () => {
    const stem = await seedTask({ outcomes: '- A note, not an outcome' })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: false,
      reason: 'no-outcomes',
    })
  })

  it('should refuse a stem that is not on the board', async () => {
    await seedTask()

    expect(
      await archiveTask(ROOT, { kind: 'stem', stem: 'v99.9-absent' }),
    ).toMatchObject({ ok: false, reason: 'no-match' })
  })

  it('should refuse when the board does not exist', async () => {
    expect(
      await archiveTask(ROOT, { kind: 'stem', stem: 'v28.1-anything' }),
    ).toMatchObject({ ok: false, reason: 'no-board' })
  })

  it('should refuse the last task pointing at a live plan', async () => {
    const stem = await seedTask({ plan: '../plans/feature-trigger.md' })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: false,
      reason: 'plan-unswept',
    })
  })

  it('should archive a task whose live plan another task still cites', async () => {
    const stem = await seedTask({ plan: '../plans/feature-trigger.md' })
    await seedTask({
      stem: 'v28.2-sibling',
      plan: '../plans/feature-trigger.md',
    })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: true,
    })
  })

  it('should count two spellings of one live plan as a single citation', async () => {
    const stem = await seedTask({ plan: '../plans/feature-trigger.md' })
    await seedTask({
      stem: 'v28.2-sibling',
      plan: '.claude/plans/feature-trigger.md',
    })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: true,
    })
  })

  it('should refuse once the last sibling sharing a live plan has archived', async () => {
    const stem = await seedTask({ plan: '../plans/feature-trigger.md' })
    await seedTask({
      stem: 'v28.2-sibling',
      plan: '../plans/feature-other.md',
    })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: false,
      reason: 'plan-unswept',
    })
  })

  it('should accept a task pointing at an archived plan', async () => {
    const stem = await seedTask({
      plan: '../plans/archive/feature-trigger.md',
    })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: true,
    })
  })

  it('should not read a sibling of the plans folder as a live plan', async () => {
    const stem = await seedTask({ plan: '../plans-legacy/feature-trigger.md' })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: true,
    })
  })

  it('should refuse a live plan written from the project root', async () => {
    const stem = await seedTask({ plan: '.claude/plans/feature-trigger.md' })

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: false,
      reason: 'plan-unswept',
    })
  })

  it('should resolve a task by the pull request it names', async () => {
    const stem = await seedTask({ pullRequest: 673 })

    expect(
      await archiveTask(ROOT, { kind: 'pull-request', number: 673 }),
    ).toMatchObject({ ok: true, stem })
  })

  it('should refuse when no task names the pull request', async () => {
    await seedTask({ pullRequest: 673 })

    expect(
      await archiveTask(ROOT, { kind: 'pull-request', number: 999 }),
    ).toMatchObject({ ok: false, reason: 'no-match' })
  })

  it('should refuse when two tasks name one pull request', async () => {
    await seedTask({ stem: 'v28.1-first', pullRequest: 673 })
    await seedTask({ stem: 'v28.2-second', pullRequest: 673 })

    expect(
      await archiveTask(ROOT, { kind: 'pull-request', number: 673 }),
    ).toMatchObject({ ok: false, reason: 'ambiguous' })
  })

  it('should clear the archived task row from the ordering file', async () => {
    const stem = await seedTask()
    const priority = join(tasksDir(ROOT), 'priority.md')
    await writeFile(
      priority,
      `| Task | Touches |\n| ---- | ------- |\n| [v28.1](${stem}.md) | \`src/\` |\n`,
    )

    const result = await archiveTask(ROOT, { kind: 'stem', stem })

    expect(result).toMatchObject({ ok: true, priorityRowRemoved: true })
    expect(await readFile(priority, 'utf8')).not.toContain(`${stem}.md`)
  })

  it('should archive without an ordering file present', async () => {
    const stem = await seedTask()

    expect(await archiveTask(ROOT, { kind: 'stem', stem })).toMatchObject({
      ok: true,
      priorityRowRemoved: false,
    })
  })
})

describe('planCitations', () => {
  it('should report a live plan no other task holds', async () => {
    const stem = await seedTask({ plan: '../plans/feature-trigger.md' })

    expect(await planCitations(ROOT, stem)).toMatchObject({
      ok: true,
      location: 'live',
      citedBy: [],
    })
  })

  it('should name the other live tasks sharing a plan', async () => {
    const stem = await seedTask({ plan: '../plans/feature-trigger.md' })
    await seedTask({
      stem: 'v28.2-sibling',
      plan: '.claude/plans/feature-trigger.md',
    })

    expect(await planCitations(ROOT, stem)).toMatchObject({
      ok: true,
      location: 'live',
      citedBy: ['v28.2-sibling'],
    })
  })

  it('should report a plan an earlier sweep archived', async () => {
    const stem = await seedTask({
      plan: '../plans/archive/feature-trigger.md',
    })

    expect(await planCitations(ROOT, stem)).toMatchObject({
      ok: true,
      location: 'archived',
      citedBy: [],
    })
  })

  it('should report a target resolving outside both plans folders', async () => {
    const stem = await seedTask({ plan: '../plans-legacy/feature-trigger.md' })

    expect(await planCitations(ROOT, stem)).toMatchObject({
      ok: true,
      location: 'outside',
    })
  })

  it('should report a task carrying no plan line', async () => {
    const stem = await seedTask()

    expect(await planCitations(ROOT, stem)).toMatchObject({
      ok: true,
      location: 'unstated',
      target: undefined,
    })
  })

  it('should refuse a stem that is not on the board', async () => {
    await seedTask()

    expect(await planCitations(ROOT, 'v99.9-absent')).toMatchObject({
      ok: false,
      reason: 'no-match',
    })
  })

  it('should refuse when the board does not exist', async () => {
    expect(await planCitations(ROOT, 'v28.1-anything')).toMatchObject({
      ok: false,
      reason: 'no-board',
    })
  })
})
