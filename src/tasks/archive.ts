import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { regenOne } from '@/indexes/regen'

const TASKS_DIR = join('.claude', 'tasks')
const ARCHIVE_DIR = join('.claude', 'task-archive')
const PLANS_DIR = join('.claude', 'plans')

/**
 * Siblings that sit on the board without being tasks: the generated index, the
 * hand-maintained ordering, and the pre-compaction session map. `validate`
 * reads the same list, so neither verb can count a sibling as a task the other
 * does not.
 */
export const RESERVED_STEMS = ['index', 'priority', 'session'] as const

export const ARCHIVE_REFUSALS = [
  'no-board',
  'no-match',
  'ambiguous',
  'no-outcomes',
  'open-outcomes',
  'plan-unswept',
] as const

export type ArchiveRefusal = (typeof ARCHIVE_REFUSALS)[number]

export type TaskSelector =
  | { readonly kind: 'stem'; readonly stem: string }
  | { readonly kind: 'pull-request'; readonly number: number }

export interface ArchiveSuccess {
  readonly ok: true
  readonly stem: string
  readonly from: string
  readonly to: string
  readonly priorityRowRemoved: boolean
  readonly indexRegenerated: boolean
}

export interface ArchiveRefused {
  readonly ok: false
  readonly reason: ArchiveRefusal
  readonly message: string
  readonly detail: readonly string[]
}

export type ArchiveOutcome = ArchiveSuccess | ArchiveRefused

export interface TaskOutcomes {
  readonly open: readonly string[]
  readonly closed: readonly string[]
}

export function tasksDir(root: string): string {
  return join(root, TASKS_DIR)
}

export function archiveDir(root: string): string {
  return join(root, ARCHIVE_DIR)
}

/**
 * Splits a task's outcome list by checkbox state. The board format puts every
 * outcome at the top level of `## Outcomes`, so an anchored match is enough and
 * no heading tracking is needed.
 */
export function readOutcomes(text: string): TaskOutcomes {
  const open: string[] = []
  const closed: string[] = []

  for (const line of text.split('\n')) {
    const match = /^- \[([ xX])\] ?(.*)$/.exec(line)
    if (!match) continue

    const [, box, body] = match
    if (box === ' ') {
      open.push(body.trim())
    } else {
      closed.push(body.trim())
    }
  }

  return { open, closed }
}

/**
 * Reads the `Pull request:` line `git-pr` writes when a pull request opens.
 * The number is a bare `#NNN` the way `Issue:` is, since neither is a path and
 * a full URL would write the remote into a gitignored file.
 */
export function readPullRequest(text: string): number | undefined {
  const match = /^Pull request:\s*#(\d+)\s*$/m.exec(text)
  return match ? Number(match[1]) : undefined
}

/**
 * Reads the `Plan:` target out of a markdown link, falling back to the older
 * bare-path form. The path is returned as written, relative to the board.
 */
export function readPlanTarget(text: string): string | undefined {
  const match = /^Plan:\s*(?:\[[^\]]*\]\(([^)]+)\)|(\S+))\s*$/m.exec(text)
  if (!match) return undefined
  return match[1] ?? match[2]
}

/**
 * Drops the archived task's row from the ordering table. Rows are matched by
 * the link they carry rather than by a line pattern, because a row holds links
 * and prose that a stream edit against it would rewrite in place.
 */
export function removePriorityRow(
  text: string,
  stem: string,
): { readonly text: string; readonly removed: boolean } {
  const target = `](${stem}.md)`
  const lines = text.split('\n')
  const kept = lines.filter((line) => !isRowFor(line, target))

  return { text: kept.join('\n'), removed: kept.length !== lines.length }
}

/**
 * A row is about a task when its first cell links to it. A later cell naming
 * another task is a reference, such as a blocker pointing at what it waits on,
 * and matching anywhere in the line would delete that task's row alongside it.
 */
function isRowFor(line: string, target: string): boolean {
  const trimmed = line.trimStart()
  if (!trimmed.startsWith('|')) return false

  const [, first] = trimmed.split('|')
  return first !== undefined && first.includes(target)
}

/**
 * Tests containment rather than a string prefix, so a sibling whose name merely
 * extends the folder's is not read as being inside it.
 */
function isUnder(path: string, dir: string): boolean {
  return path === dir || path.startsWith(`${dir}${sep}`)
}

/**
 * Resolves the `Plan:` target against the board and against the project root
 * both, which is how `claude-docs` reads the same line. It accepts `../plans/x.md`
 * and `.claude/plans/x.md` as one file, so a gate reading only the first form
 * would pass the second and strand the plan this exists to protect.
 */
function isLivePlan(target: string, dir: string, root: string): boolean {
  const plans = join(root, PLANS_DIR)

  return (
    isUnder(resolve(dir, target), plans) ||
    isUnder(resolve(root, target), plans)
  )
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

async function matchByPullRequest(
  dir: string,
  stems: readonly string[],
  number: number,
): Promise<string[]> {
  const read = await Promise.all(
    stems.map(async (stem) => ({
      stem,
      number: readPullRequest(await readFile(join(dir, `${stem}.md`), 'utf8')),
    })),
  )

  return read.filter((entry) => entry.number === number).map(({ stem }) => stem)
}

function refuse(
  reason: ArchiveRefusal,
  message: string,
  detail: readonly string[] = [],
): ArchiveRefused {
  return { ok: false, reason, message, detail }
}

async function resolveStem(
  dir: string,
  selector: TaskSelector,
): Promise<string | ArchiveRefused> {
  const stems = await listTaskStems(dir)

  if (selector.kind === 'stem') {
    if (!stems.includes(selector.stem)) {
      return refuse(
        'no-match',
        `No task named ${selector.stem} on the board.`,
        stems,
      )
    }
    return selector.stem
  }

  const matched = await matchByPullRequest(dir, stems, selector.number)

  if (matched.length === 0) {
    return refuse('no-match', `No task names pull request #${selector.number}.`)
  }

  if (matched.length > 1) {
    return refuse(
      'ambiguous',
      `${matched.length} tasks name pull request #${selector.number}. One task, one pull request.`,
      matched,
    )
  }

  return matched[0]
}

/**
 * Archives one task as a single unit: the move, the ordering-row removal, and
 * the index regen. The hook and `claude-tasks` both call this, so every gate
 * refuses rather than reports. A caller with nobody watching cannot act on a
 * warning, and two callers gating differently is the drift this exists to stop.
 */
export async function archiveTask(
  root: string,
  selector: TaskSelector,
): Promise<ArchiveOutcome> {
  const dir = tasksDir(root)

  if (!existsSync(dir)) {
    return refuse('no-board', `No task board at ${relative(root, dir)}.`)
  }

  const resolved = await resolveStem(dir, selector)
  if (typeof resolved !== 'string') return resolved

  const stem = resolved
  const from = join(dir, `${stem}.md`)
  const text = await readFile(from, 'utf8')

  const { open, closed } = readOutcomes(text)

  if (open.length > 0) {
    return refuse(
      'open-outcomes',
      `${stem} has ${open.length} open outcome(s). Close them or cut them from the task, then archive.`,
      open,
    )
  }

  if (closed.length === 0) {
    return refuse(
      'no-outcomes',
      `${stem} carries no outcomes, so nothing marks it shipped.`,
    )
  }

  const planTarget = readPlanTarget(text)
  if (planTarget && isLivePlan(planTarget, dir, root)) {
    return refuse(
      'plan-unswept',
      `${stem} still points at a live plan. Run /claude-docs to sweep it first, then archive.`,
      [planTarget],
    )
  }

  const destination = archiveDir(root)
  await mkdir(destination, { recursive: true })
  const to = join(destination, `${stem}.md`)
  await rename(from, to)

  const priorityRowRemoved = await clearPriorityRow(dir, stem)
  const regen = await regenOne(dir, { dryRun: false })

  return {
    ok: true,
    stem,
    from,
    to,
    priorityRowRemoved,
    indexRegenerated: regen.action === 'written',
  }
}

async function clearPriorityRow(dir: string, stem: string): Promise<boolean> {
  const path = join(dir, 'priority.md')
  if (!existsSync(path)) return false

  const { text, removed } = removePriorityRow(
    await readFile(path, 'utf8'),
    stem,
  )
  if (removed) await writeFile(path, text)

  return removed
}
