import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tasksDir } from '@/tasks/archive'
import {
  type Finding,
  type FindingKind,
  orderingPath,
  readBoard,
  readPaths,
  validateBoard,
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

async function seedTask(stem: string): Promise<void> {
  mkdirSync(tasksDir(ROOT), { recursive: true })
  await writeFile(join(tasksDir(ROOT), `${stem}.md`), `# ${stem}\n`)
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

  it('should report a task file that no row names', async () => {
    await seedTask('v1.0-first')
    await seedTask('v9.0-orphan')
    await seedPlan('v1.0-first')
    await seedBoard(boardBody([readyTable([{ stem: 'v1.0-first' }])]))

    const outcome = await validateBoard(ROOT)

    expect(outcome.ok && outcome.findings).toMatchObject([
      { kind: 'row-missing', subject: 'v9.0-orphan' },
    ])
  })

  it('should skip the generated, ordering, and session siblings', async () => {
    await seedTask('v1.0-first')
    await seedTask('index')
    await seedTask('session')
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
        '## Up next',
        '',
        '| Task | Touches | Waiting on |',
        '| ---- | ------- | ---------- |',
        '| [v2.0-second](v2.0-second.md) | `src/a.ts` | v1.0-first |',
        '',
      ]),
    )

    expect(await validateBoard(ROOT)).toMatchObject({ findings: [] })
  })
})
