import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tasksDir } from '@/tasks/archive'
import {
  backlogPath,
  type Finding,
  type FindingKind,
  orderingPath,
  readBacklog,
  readBoard,
  readPaths,
  validateBoard,
  type ValidateOptions,
} from '@/tasks/validate'

let ROOT: string

interface RowFixture {
  readonly stem: string
  readonly touches?: string
  readonly plan?: string
}

function readyTable(rows: readonly RowFixture[]): string {
  const body = rows.map(
    ({ stem, touches = '`src/a.ts`', plan = `../plans/feature-${stem}.md` }) =>
      `| [${stem}](${stem}.md) | ${touches} | [${stem}](${plan}) |`,
  )

  return [
    '## Run now',
    '',
    '| Task | Touches | Plan |',
    '| ---- | ------- | ---- |',
    ...body,
    '',
  ].join('\n')
}

function boardBody(sections: readonly string[]): string {
  return [
    '---',
    'title: Priority',
    'description: One line on what the board covers',
    '---',
    '',
    '# Priority',
    '',
    ...sections,
  ].join('\n')
}

async function seedBoard(text: string): Promise<void> {
  mkdirSync(tasksDir(ROOT), { recursive: true })
  await writeFile(orderingPath(ROOT), text)
}

async function seedTask(
  stem: string,
  outcomes = '',
  pullRequest?: number,
): Promise<void> {
  mkdirSync(tasksDir(ROOT), { recursive: true })
  const origin = pullRequest ? `Pull request: #${pullRequest}\n\n` : ''
  await writeFile(
    join(tasksDir(ROOT), `${stem}.md`),
    `# ${stem}\n\n${origin}## Outcomes\n\n${outcomes}\n`,
  )
}

/** Answers the trunk from a fixture, so no test reaches for a git history. */
function trunkHolding(...landed: readonly number[]): ValidateOptions {
  return { trunk: async (number) => landed.includes(number) }
}

const UNREACHABLE_TRUNK: ValidateOptions = { trunk: async () => undefined }

async function seedArchivedTask(stem: string): Promise<void> {
  const archive = join(ROOT, '.claude', 'tasks', 'archive')
  mkdirSync(archive, { recursive: true })
  await writeFile(join(archive, `${stem}.md`), `# ${stem}\n`)
}

function parkedTable(rows: readonly string[]): string {
  return [
    '## Up next',
    '',
    '| Task | Touches | Waiting on |',
    '| ---- | ------- | ---------- |',
    ...rows,
    '',
  ].join('\n')
}

async function seedBacklog(lines: readonly string[]): Promise<void> {
  mkdirSync(tasksDir(ROOT), { recursive: true })
  await writeFile(
    backlogPath(ROOT),
    [
      '---',
      'title: Backlog',
      'description: One line on what the backlog holds',
      '---',
      '',
      '# Backlog',
      '',
      'Unordered. Nothing here is queued.',
      '',
      ...lines,
      '',
    ].join('\n'),
  )
}

async function seedPlan(stem: string): Promise<void> {
  const plans = join(ROOT, '.claude', 'plans')
  mkdirSync(plans, { recursive: true })
  await writeFile(join(plans, `feature-${stem}.md`), `# ${stem}\n`)
}

function kinds(findings: readonly Finding[]): FindingKind[] {
  return findings.map((finding) => finding.kind)
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-tasks-validate-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('readPaths', () => {
  it('should read every backticked path out of a prose cell', () => {
    expect(
      readPaths('`src/a.ts` and its test, plus a `commands.md` row'),
    ).toEqual(['src/a.ts', 'commands.md'])
  })

  it('should drop a backticked span that names no file', () => {
    expect(readPaths('`claude-memory-capture` and `claude-docs`')).toEqual([])
  })

  it('should strip a leading dot slash and a trailing slash', () => {
    expect(readPaths('`./src/tasks/` holds it')).toEqual(['src/tasks'])
  })

  it('should collapse a path named twice in one cell', () => {
    expect(readPaths('`src/a.ts`, then `src/a.ts` again')).toEqual(['src/a.ts'])
  })

  it('should drop a task version whose trailing digits look like an extension', () => {
    expect(readPaths('waits on `v40.2` and `v41.7`')).toEqual([])
  })
})

describe('readBoard', () => {
  it('should key each row to the readiness group above it', () => {
    const text = boardBody([
      readyTable([{ stem: 'v1.0-first' }]),
      '## Up next',
      '',
      '| Task | Touches | Waiting on |',
      '| ---- | ------- | ---------- |',
      '| [v2.0-second](v2.0-second.md) | `src/b.ts` | v1.0 |',
      '',
    ])

    const { rows, groups } = readBoard(text)

    expect(groups).toEqual(['Run now', 'Up next'])
    expect(rows.map((row) => [row.group, row.stem])).toEqual([
      ['Run now', 'v1.0-first'],
      ['Up next', 'v2.0-second'],
    ])
  })

  it('should leave touches absent when the group fixes no such column', () => {
    const text = boardBody([
      '## Needs a plan',
      '',
      '| Task | Waiting on |',
      '| ---- | ---------- |',
      '| [v3.0-third](v3.0-third.md) | nothing |',
      '',
    ])

    expect(readBoard(text).rows[0]?.touches).toBeUndefined()
  })

  it('should report no group when the headings are named differently', () => {
    const text = boardBody([
      '## Ready',
      '',
      '| Task | Touches | Plan |',
      '| ---- | ------- | ---- |',
      '| [v1.0-first](v1.0-first.md) | `src/a.ts` | [p](../plans/p.md) |',
      '',
    ])

    expect(readBoard(text)).toEqual({ rows: [], groups: [] })
  })

  it('should read a column by its header rather than by its position', () => {
    const text = boardBody([
      '## Run now',
      '',
      '| Task | Plan | Touches |',
      '| ---- | ---- | ------- |',
      '| [v1.0-first](v1.0-first.md) | [p](../plans/p.md) | `src/a.ts` |',
      '',
    ])

    expect(readBoard(text).rows[0]).toMatchObject({
      plan: '../plans/p.md',
      touches: ['src/a.ts'],
    })
  })
})

describe('readBacklog', () => {
  it('should read one row per bullet carrying a task link', () => {
    expect(
      readBacklog(
        [
          '- [v9.0 first](v9.0-first.md)',
          '- [v9.1 second](v9.1-second.md)',
        ].join('\n'),
      ),
    ).toEqual([
      { label: 'v9.0 first', stem: 'v9.0-first' },
      { label: 'v9.1 second', stem: 'v9.1-second' },
    ])
  })

  it('should skip a bullet carrying prose instead of a pointer', () => {
    expect(readBacklog('- nothing here is queued')).toEqual([])
  })

  it('should skip a pointer carrying a directory', () => {
    expect(readBacklog('- [the plan](../plans/feature-x.md)')).toEqual([])
  })

  it('should skip a pointer naming a reserved sibling', () => {
    expect(readBacklog('- [priority](priority.md)')).toEqual([])
  })
})

describe('validateBoard', () => {
  it('should refuse when the project carries no board', async () => {
    expect(await validateBoard(ROOT)).toMatchObject({
      ok: false,
      reason: 'no-board',
    })
  })

  it('should refuse when the board carries no ordering file', async () => {
    mkdirSync(tasksDir(ROOT), { recursive: true })

    expect(await validateBoard(ROOT)).toMatchObject({
      ok: false,
      reason: 'no-ordering',
    })
  })

  it('should refuse when no readiness group is recognized', async () => {
    await seedBoard(boardBody(['## Ready', '', 'nothing here', '']))

    expect(await validateBoard(ROOT)).toMatchObject({
      ok: false,
      reason: 'no-groups',
    })
  })

  it('should pass a board whose rows resolve and touch disjoint files', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedPlan('v2.0-second')
    await seedBoard(
      boardBody([
        readyTable([
          { stem: 'v1.0-first', touches: '`src/a.ts`' },
          { stem: 'v2.0-second', touches: '`src/b.ts`' },
        ]),
      ]),
    )

    expect(await validateBoard(ROOT)).toMatchObject({
      ok: true,
      rows: 2,
      tasks: 2,
      findings: [],
    })
  })

  it('should report a run now row whose plan pointer resolves nowhere', async () => {
    await seedTask('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && kinds(outcome.findings)).toEqual(['plan-unresolved'])
  })

  it('should report a run now row carrying prose in place of a plan link', async () => {
    await seedTask('v1.0-first')
    await seedBoard(
      boardBody([
        '## Run now',
        '',
        '| Task | Touches | Plan |',
        '| ---- | ------- | ---- |',
        '| [v1.0-first](v1.0-first.md) | `src/a.ts` | planned in session |',
        '',
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && kinds(outcome.findings)).toEqual(['plan-unstated'])
  })

  it('should report a row whose task file is gone', async () => {
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && kinds(outcome.findings)).toEqual(['task-unresolved'])
  })

  it('should report a task file that neither surface names', async () => {
    await seedTask('v1.0-first')
    await seedTask('v9.0-orphan')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      { kind: 'row-missing', subject: 'v9.0-orphan' },
    ])
  })

  it('should account for a task file the backlog names', async () => {
    await seedTask('v1.0-first')
    await seedTask('v9.0-parked')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))
    await seedBacklog(['- [v9.0 parked](v9.0-parked.md)'])

    expect(await validateBoard(ROOT)).toMatchObject({
      backlog: 1,
      tasks: 2,
      findings: [],
    })
  })

  it('should report a task sitting on the board and the backlog both', async () => {
    await seedTask('v1.0-first')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))
    await seedBacklog(['- [v1.0 first](v1.0-first.md)'])

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      { kind: 'row-duplicated', subject: 'v1.0-first' },
    ])
  })

  it('should report a backlog line whose task file is gone', async () => {
    await seedTask('v1.0-first')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))
    await seedBacklog(['- [v9.0 gone](v9.0-gone.md)'])

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      { kind: 'task-unresolved', subject: 'v9.0-gone' },
    ])
  })

  it('should skip the backlog sibling when counting task files', async () => {
    await seedTask('v1.0-first')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))
    await seedBacklog([])

    expect(await validateBoard(ROOT)).toMatchObject({ tasks: 1, findings: [] })
  })

  it('should skip the generated, ordering, and session siblings', async () => {
    await seedTask('v1.0-first')
    await seedTask('index')
    await seedTask('session')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))

    expect(await validateBoard(ROOT)).toMatchObject({ tasks: 1, findings: [] })
  })

  it('should skip a session map named for the session that wrote it', async () => {
    await seedTask('v1.0-first')
    await seedTask('session-feature-work')
    await seedTask('session-main')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))

    expect(await validateBoard(ROOT)).toMatchObject({ tasks: 1, findings: [] })
  })

  it('should report a task carrying a row in two groups', async () => {
    await seedTask('v1.0-first')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first' }]),
        '## Up next',
        '',
        '| Task | Touches | Waiting on |',
        '| ---- | ------- | ---------- |',
        '| [v1.0-first](v1.0-first.md) | `src/a.ts` | nothing |',
        '',
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && kinds(outcome.findings)).toEqual(['row-duplicated'])
  })

  it('should report two run now rows touching the same file', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedPlan('v2.0-second')
    await seedBoard(
      boardBody([
        readyTable([
          { stem: 'v1.0-first', touches: '`src/a.ts`, `docs/commands.md`' },
          { stem: 'v2.0-second', touches: '`src/b.ts`, `docs/commands.md`' },
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      { kind: 'touches-collided', message: 'both touch docs/commands.md.' },
    ])
  })

  it('should report a directory colliding with a file inside it', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedPlan('v2.0-second')
    await seedBoard(
      boardBody([
        readyTable([
          { stem: 'v1.0-first', touches: '`src/tasks/`' },
          { stem: 'v2.0-second', touches: '`src/tasks/archive.ts`' },
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && kinds(outcome.findings)).toEqual(['touches-collided'])
  })

  it('should name the row that claimed the containing path', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedPlan('v2.0-second')
    await seedBoard(
      boardBody([
        readyTable([
          { stem: 'v1.0-first', touches: '`src/tasks/archive.ts`' },
          { stem: 'v2.0-second', touches: '`src/tasks/`' },
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      {
        kind: 'touches-collided',
        message: 'both touch src/tasks, which v2.0-second claims as a folder.',
      },
    ])
  })

  it('should report a run now row claiming a bare folder', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedPlan('v2.0-second')
    await seedBoard(
      boardBody([
        readyTable([
          { stem: 'v1.0-first', touches: '`src/tasks/`' },
          { stem: 'v2.0-second', touches: '`docs/commands.md`' },
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.claims).toMatchObject([
      {
        group: 'Run now',
        subject: 'v1.0-first',
        message:
          'claims the whole src/tasks folder, so it collides with every row written under it.',
      },
    ])
  })

  it('should leave a resolving file with no extension out of the claims', async () => {
    await mkdir(join(ROOT, '.husky'), { recursive: true })
    await writeFile(join(ROOT, '.husky', 'pre-push'), '#!/bin/sh\n')
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedPlan('v2.0-second')
    await seedBoard(
      boardBody([
        readyTable([
          { stem: 'v1.0-first', touches: '`.husky/pre-push`' },
          { stem: 'v2.0-second', touches: '`docs/commands.md`' },
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.claims).toEqual([])
  })

  it('should report a run now table declaring no touches column', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        '## Run now',
        '',
        '| Task | Plan |',
        '| ---- | ---- |',
        '| [v1.0-first](v1.0-first.md) | [p](../plans/feature-v1.0-first.md) |',
        '| [v2.0-second](v2.0-second.md) | [p](../plans/feature-v1.0-first.md) |',
        '',
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && kinds(outcome.findings)).toEqual([
      'touches-unstated',
      'touches-unstated',
    ])
  })

  it('should report a run now row whose touches column names no file', async () => {
    await seedTask('v1.0-first')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([readyTable([{ stem: 'v1.0-first', touches: 'the board' }])]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && kinds(outcome.findings)).toEqual(['touches-unstated'])
  })

  it('should leave an up next collision unreported', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | v1.0-first |',
        ]),
      ]),
    )

    expect(await validateBoard(ROOT)).toMatchObject({ findings: [] })
  })

  it('should report a parked row whose cited task is archived', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedArchivedTask('v3.0-gone')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v3.0-gone](v3.0-gone.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      {
        kind: 'blocker-settled',
        message: 'waits on v3.0-gone, which is archived.',
      },
    ])
  })

  it('should report a cited task that is neither on the board nor archived', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v9.0-typo](v9.0-typo.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      {
        kind: 'blocker-unresolved',
        message:
          'waits on v9.0-typo, which is neither on the board nor archived.',
      },
    ])
  })

  it('should report a parked row whose cited pull request reached the trunk', async () => {
    await seedTask('v1.0-first', '- [x] shipped', 673)
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v1.0-first](v1.0-first.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT, trunkHolding(673))

    expect(outcome.ok && outcome.findings).toMatchObject([
      {
        kind: 'blocker-settled',
        message:
          'waits on v1.0-first, whose pull request #673 reached the trunk.',
      },
    ])
  })

  it('should leave a parked row whose cited pull request is not on the trunk unreported', async () => {
    await seedTask('v1.0-first', '- [x] shipped', 673)
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v1.0-first](v1.0-first.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT, trunkHolding())

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.untested).toEqual([])
  })

  it('should park a row whose cited task closed every outcome but names no pull request', async () => {
    await seedTask('v1.0-first', '- [x] shipped')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v1.0-first](v1.0-first.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT, trunkHolding(673))

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.untested).toMatchObject([
      {
        subject: 'v2.0-second',
        message:
          'waits on v1.0-first, which closed every outcome but names no pull request, so nothing tests whether the work reached the trunk.',
      },
    ])
  })

  it('should park a row whose trunk could not be read', async () => {
    await seedTask('v1.0-first', '- [x] shipped', 673)
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v1.0-first](v1.0-first.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT, UNREACHABLE_TRUNK)

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.untested).toMatchObject([
      {
        subject: 'v2.0-second',
        message:
          'waits on v1.0-first, whose pull request #673 could not be read against the trunk.',
      },
    ])
  })

  it('should leave a parked row whose cited task has an open outcome unreported', async () => {
    await seedTask('v1.0-first', '- [x] one\n- [ ] two')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v1.0-first](v1.0-first.md) |',
        ]),
      ]),
    )

    expect(await validateBoard(ROOT)).toMatchObject({ findings: [] })
  })

  it('should leave a parked row whose cited task carries no outcome box unreported', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v1.0-first](v1.0-first.md) |',
        ]),
      ]),
    )

    expect(await validateBoard(ROOT)).toMatchObject({ findings: [] })
  })

  it('should ignore a checkbox inside a fenced block on the cited task', async () => {
    await seedTask(
      'v1.0-first',
      '- [x] shipped\n\n```markdown\n- [ ] a sample the task displays\n```',
      673,
    )
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [v1.0-first](v1.0-first.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT, trunkHolding(673))

    expect(outcome.ok && kinds(outcome.findings)).toEqual(['blocker-settled'])
  })

  it('should read no task out of a blocker cell pointing at a plan', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | [second](../plans/feature-v2.0-second.md) |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.untested).toMatchObject([
      { group: 'Up next', subject: 'v2.0-second' },
    ])
  })

  it('should report a parked row whose cited file nothing under run now holds', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/z.ts` | `src/z.ts`, held by the task already running |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      {
        kind: 'blocker-settled',
        subject: 'v2.0-second',
        message: 'waits on src/z.ts, which nothing under Run now holds.',
      },
    ])
  })

  it('should leave a parked row whose cited file is still held unreported', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/a.ts` | `src/a.ts`, held by the task already running |',
        ]),
      ]),
    )

    expect(await validateBoard(ROOT)).toMatchObject({ findings: [] })
  })

  it('should call a row untested when it declares files but its blocker cites none', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | `src/z.ts` | a published upstream release, cleared when it ships |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.untested).toMatchObject([
      { group: 'Up next', subject: 'v2.0-second' },
    ])
  })

  it('should report a parked row citing no task and naming no file as untested', async () => {
    await seedTask('v1.0-first')
    await seedTask('v2.0-second')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        parkedTable([
          '| [v2.0-second](v2.0-second.md) | none yet | an operator run from a shell |',
        ]),
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.untested).toMatchObject([
      {
        group: 'Up next',
        subject: 'v2.0-second',
        message:
          'cites no task and no file, so neither half of its blocker is mechanical.',
      },
    ])
  })

  it('should report a needs a plan row stating no file set as untested', async () => {
    await seedTask('v1.0-first')
    await seedTask('v3.0-third')
    await seedPlan('v1.0-first')
    await seedBoard(
      boardBody([
        readyTable([{ stem: 'v1.0-first', touches: '`src/a.ts`' }]),
        '## Needs a plan',
        '',
        '| Task | Waiting on |',
        '| ---- | ---------- |',
        '| [v3.0-third](v3.0-third.md) | a plan settling what the sweep covers |',
        '',
      ]),
    )

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toEqual([])
    expect(outcome.ok && outcome.untested).toMatchObject([
      {
        group: 'Needs a plan',
        subject: 'v3.0-third',
        message:
          'cites no task and no file, so neither half of its blocker is mechanical.',
      },
    ])
  })
})
