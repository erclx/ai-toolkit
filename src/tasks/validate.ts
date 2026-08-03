import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { RESERVED_STEMS, tasksDir } from '@/tasks/archive'

const ORDERING_FILE = 'priority.md'

/**
 * The readiness headings `.claude/standards/tasks.md` fixes. The names are the
 * contract rather than a suggestion, so a board grouping under names of its own
 * reads as carrying no group at all and the run refuses instead of reporting a
 * clean board it never parsed.
 */
export const BOARD_GROUPS = ['Run now', 'Up next', 'Needs a plan'] as const

export type BoardGroup = (typeof BOARD_GROUPS)[number]

export const VALIDATE_REFUSALS = [
  'no-board',
  'no-ordering',
  'no-groups',
] as const

export type ValidateRefusal = (typeof VALIDATE_REFUSALS)[number]

export const FINDING_KINDS = [
  'plan-unstated',
  'plan-unresolved',
  'task-unresolved',
  'row-missing',
  'row-duplicated',
  'touches-unstated',
  'touches-collided',
] as const

export type FindingKind = (typeof FINDING_KINDS)[number]

export interface Finding {
  readonly kind: FindingKind
  readonly group: BoardGroup | undefined
  readonly subject: string
  readonly message: string
}

export interface BoardRow {
  readonly group: BoardGroup
  readonly label: string
  readonly stem: string | undefined
  readonly plan: string | undefined
  /** Absent when the group fixes no `Touches` column, empty when it read none. */
  readonly touches: readonly string[] | undefined
}

export interface ValidateReport {
  readonly ok: true
  readonly rows: number
  readonly tasks: number
  readonly findings: readonly Finding[]
}

export interface ValidateRefused {
  readonly ok: false
  readonly reason: ValidateRefusal
  readonly message: string
}

export type ValidateOutcome = ValidateReport | ValidateRefused

export function orderingPath(root: string): string {
  return join(tasksDir(root), ORDERING_FILE)
}

/**
 * Pulls the target out of a markdown link, which is how both the `Task` and the
 * `Plan` column spell their pointer. A cell carrying prose instead of a link
 * yields nothing, and that absence is the finding rather than a parse failure.
 */
function linkTarget(cell: string): string | undefined {
  const match = /\[[^\]]*\]\(([^)]+)\)/.exec(cell)
  return match ? match[1].trim() : undefined
}

function linkText(cell: string): string {
  const match = /\[([^\]]*)\]\([^)]+\)/.exec(cell)
  return (match ? match[1] : cell).trim()
}

function stemOf(target: string): string | undefined {
  const name = target.split('/').pop()
  if (!name || !name.endsWith('.md')) return undefined
  return name.slice(0, -'.md'.length)
}

/**
 * Reads the file set out of a `Touches` cell written as prose. Paths are the
 * backticked spans, which is the only marker the column carries, and a span
 * naming a skill or a command rather than a file is dropped by the same test.
 *
 * An extension opens with a letter, which is what separates `commands.md` from
 * a task version like `v40.2`. Reading the version as a path would collide two
 * rows that merely cite the same task.
 */
export function readPaths(cell: string): string[] {
  const spans = cell.match(/`[^`]+`/g) ?? []
  const paths = spans
    .map((span) => span.slice(1, -1).trim())
    .filter(
      (span) => span.includes('/') || /\.[A-Za-z][A-Za-z0-9]*$/.test(span),
    )
    .map((span) => span.replace(/^\.\//, '').replace(/\/+$/, ''))

  return [...new Set(paths)]
}

/**
 * Two paths touch the same work when they are equal or one contains the other.
 * A row naming a directory and a row naming a file inside it collide, which a
 * set intersection on the written strings alone would miss.
 */
function sharesPath(left: string, right: string): boolean {
  return (
    left === right ||
    left.startsWith(`${right}/`) ||
    right.startsWith(`${left}/`)
  )
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isSeparator(cells: readonly string[]): boolean {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function columnIndex(header: readonly string[], name: string): number {
  return header.findIndex((cell) => cell.toLowerCase() === name)
}

function isGroup(heading: string): heading is BoardGroup {
  return (BOARD_GROUPS as readonly string[]).includes(heading)
}

/**
 * Parses the ordering file into rows keyed by readiness group. Columns are read
 * from each table's own header rather than by position, so a group whose shape
 * differs from this repository's is reported for what it lacks instead of
 * having its second cell read as something it never was.
 */
export function readBoard(text: string): {
  readonly rows: readonly BoardRow[]
  readonly groups: readonly BoardGroup[]
} {
  const rows: BoardRow[] = []
  const groups: BoardGroup[] = []

  let group: BoardGroup | undefined
  let header: string[] | undefined

  for (const line of text.split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading) {
      const title = heading[1]
      group = isGroup(title) ? title : undefined
      header = undefined
      if (group && !groups.includes(group)) groups.push(group)
      continue
    }

    if (!group || !line.trimStart().startsWith('|')) continue

    const cells = splitCells(line)
    if (isSeparator(cells)) continue

    if (!header) {
      header = cells
      continue
    }

    const taskAt = columnIndex(header, 'task')
    const planAt = columnIndex(header, 'plan')
    const touchesAt = columnIndex(header, 'touches')

    const task = taskAt >= 0 ? (cells[taskAt] ?? '') : ''
    const target = linkTarget(task)
    const plan = planAt >= 0 ? linkTarget(cells[planAt] ?? '') : undefined

    rows.push({
      group,
      label: linkText(task) || task,
      stem: target ? stemOf(target) : undefined,
      plan,
      touches: touchesAt >= 0 ? readPaths(cells[touchesAt] ?? '') : undefined,
    })
  }

  return { rows, groups }
}

async function listTaskStems(dir: string): Promise<string[]> {
  const entries = await readdir(dir)
  const reserved: readonly string[] = RESERVED_STEMS

  return entries
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => entry.slice(0, -'.md'.length))
    .filter((stem) => !reserved.includes(stem))
    .sort()
}

/**
 * Resolves a pointer against the board and against the project root both, the
 * way `claude-docs` reads the same line. A fragment is dropped first, since an
 * anchor is part of the link and never part of the path.
 */
function resolves(target: string, dir: string, root: string): boolean {
  const path = target.split('#')[0]
  if (!path) return false

  return existsSync(resolve(dir, path)) || existsSync(resolve(root, path))
}

function checkMapping(
  rows: readonly BoardRow[],
  stems: readonly string[],
  dir: string,
): Finding[] {
  const findings: Finding[] = []
  const seen = new Map<string, number>()

  for (const row of rows) {
    if (!row.stem) {
      findings.push({
        kind: 'task-unresolved',
        group: row.group,
        subject: row.label,
        message: 'names no task file, so the row points at nothing.',
      })
      continue
    }

    seen.set(row.stem, (seen.get(row.stem) ?? 0) + 1)

    if (!existsSync(join(dir, `${row.stem}.md`))) {
      findings.push({
        kind: 'task-unresolved',
        group: row.group,
        subject: row.stem,
        message: 'has a row and no task file.',
      })
    }
  }

  for (const [stem, count] of seen) {
    if (count > 1) {
      findings.push({
        kind: 'row-duplicated',
        group: undefined,
        subject: stem,
        message: `carries ${count} rows. A task belongs to exactly one group.`,
      })
    }
  }

  for (const stem of stems) {
    if (!seen.has(stem)) {
      findings.push({
        kind: 'row-missing',
        group: undefined,
        subject: stem,
        message: 'is a task file with no row on the board.',
      })
    }
  }

  return findings
}

function checkPlans(
  rows: readonly BoardRow[],
  dir: string,
  root: string,
): Finding[] {
  const findings: Finding[] = []

  for (const row of rows) {
    if (row.group !== 'Run now') continue

    if (!row.plan) {
      findings.push({
        kind: 'plan-unstated',
        group: row.group,
        subject: row.stem ?? row.label,
        message:
          'states no plan pointer, so the readiness claim cannot be checked.',
      })
      continue
    }

    if (!resolves(row.plan, dir, root)) {
      findings.push({
        kind: 'plan-unresolved',
        group: row.group,
        subject: row.stem ?? row.label,
        message: `points at ${row.plan}, which resolves to no file.`,
      })
    }
  }

  return findings
}

/**
 * The half of the `## Run now` test a person cannot check by eye. Two rows a
 * worker may be handed at once must touch disjoint files, and the `Touches`
 * column is the only place either set is written down.
 */
function checkCollisions(rows: readonly BoardRow[]): Finding[] {
  const findings: Finding[] = []
  const ready = rows.filter((row) => row.group === 'Run now')

  for (const row of ready) {
    // An absent column and an unreadable one both leave the row untested by
    // the loop below, so reporting only the second would pass a board whose
    // `## Run now` table declares no file set at all.
    if (!row.touches || row.touches.length === 0) {
      findings.push({
        kind: 'touches-unstated',
        group: row.group,
        subject: row.stem ?? row.label,
        message: 'names no file, so its collisions cannot be read.',
      })
    }
  }

  for (let i = 0; i < ready.length; i += 1) {
    for (let j = i + 1; j < ready.length; j += 1) {
      const left = ready[i]
      const right = ready[j]
      const shared = (left.touches ?? []).filter((path) =>
        (right.touches ?? []).some((other) => sharesPath(path, other)),
      )

      if (shared.length === 0) continue

      findings.push({
        kind: 'touches-collided',
        group: 'Run now',
        subject: `${left.stem ?? left.label} and ${right.stem ?? right.label}`,
        message: `both touch ${shared.join(', ')}.`,
      })
    }
  }

  return findings
}

function refuse(reason: ValidateRefusal, message: string): ValidateRefused {
  return { ok: false, reason, message }
}

/**
 * Reports what every board row claims against what the tree holds. It writes
 * nothing: a row is a session's claim about readiness, and a validator that
 * repaired one would be asserting the claim it exists to test.
 */
export async function validateBoard(root: string): Promise<ValidateOutcome> {
  const dir = tasksDir(root)
  if (!existsSync(dir)) {
    return refuse('no-board', `No task board at ${dir}.`)
  }

  const ordering = orderingPath(root)
  if (!existsSync(ordering)) {
    return refuse('no-ordering', `No ordering file at ${ordering}.`)
  }

  const { rows, groups } = readBoard(await readFile(ordering, 'utf8'))

  if (groups.length === 0) {
    return refuse(
      'no-groups',
      `No readiness group in ${ORDERING_FILE}. Expected one of: ${BOARD_GROUPS.join(', ')}.`,
    )
  }

  const stems = await listTaskStems(dir)

  const findings = [
    ...checkMapping(rows, stems, dir),
    ...checkPlans(rows, dir, root),
    ...checkCollisions(rows),
  ]

  return { ok: true, rows: rows.length, tasks: stems.length, findings }
}
