import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { regenOne } from '@/indexes/regen'
import { isUnder } from '@/paths'

const TASKS_DIR = join('.claude', 'tasks')
const ARCHIVE_DIR = join(TASKS_DIR, 'archive')
const PLANS_DIR = join('.claude', 'plans')
const PLANS_ARCHIVE_DIR = join(PLANS_DIR, 'archive')

/**
 * Siblings that sit on the board without being tasks: the generated index, the
 * hand-maintained ordering, the unordered backlog beside it, and a handoff a
 * session wrote before the file took one name per session. `validate` reads the
 * same list, so neither verb can count a sibling as a task the other does not.
 */
export const RESERVED_STEMS = [
  'index',
  'priority',
  'backlog',
  'session',
] as const

/** The pre-compaction handoff takes one file per session, so its stems vary. */
const SESSION_MAP_PREFIX = 'session-'

export function isReservedStem(stem: string): boolean {
  const reserved: readonly string[] = RESERVED_STEMS

  return reserved.includes(stem) || stem.startsWith(SESSION_MAP_PREFIX)
}

/**
 * `bad-input` describes the command line rather than the board, which is the
 * split `record.ts` draws for the same reason. A caller naming two selectors
 * answered as `ambiguous` sends a session to repair a task citation that is
 * fine, so the three task verbs answer one mistake one way.
 */
export const ARCHIVE_REFUSALS = [
  'no-board',
  'no-match',
  'ambiguous',
  'no-outcomes',
  'open-outcomes',
  'plan-unswept',
  'bad-input',
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

export const OUTCOME_PATTERN = /^- \[([ xX])\] ?(.*)$/

/**
 * Marks the lines sitting inside a fenced block, the fence delimiters included.
 * A checkbox in a sample a task displays is not an outcome the task claims, and
 * counting one shifts every position after it. Every reader of the outcome list
 * shares this so none of them can disagree about what the list holds.
 */
export function fenceMask(lines: readonly string[]): boolean[] {
  let inside = false

  return lines.map((line) => {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inside = !inside
      return true
    }
    return inside
  })
}

/**
 * Splits a task's outcome list by checkbox state. The board format puts every
 * outcome at the top level of `## Outcomes`, so an anchored match is enough and
 * no heading tracking is needed.
 */
export function readOutcomes(text: string): TaskOutcomes {
  const open: string[] = []
  const closed: string[] = []
  const lines = text.split('\n')
  const fenced = fenceMask(lines)

  for (const [index, line] of lines.entries()) {
    if (fenced[index]) continue

    const match = OUTCOME_PATTERN.exec(line)
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
 * Resolves the `Plan:` target against the board and against the project root
 * both, which is how `claude-docs` reads the same line. It accepts `../plans/x.md`
 * and `.claude/plans/x.md` as one file, so a gate reading only the first form
 * would pass the second and strand the plan this exists to protect.
 *
 * The resolved path is returned rather than a boolean, because the citation
 * count below compares two tasks by where their targets land and not by the
 * strings they wrote. A target outside the live plans folder yields nothing,
 * which is an archived plan or a pointer into somewhere else entirely.
 *
 * The archive sits inside the folder it archives, so containment alone reads an
 * archived plan as live. Subtracting it is what keeps a closed task from being
 * counted as a citation the sweep has yet to make.
 */
export function resolveLivePlan(
  target: string,
  dir: string,
  root: string,
): string | undefined {
  const plans = join(root, PLANS_DIR)
  const archive = join(root, PLANS_ARCHIVE_DIR)
  const fromBoard = resolve(dir, target)
  const fromRoot = resolve(root, target)

  if (isUnder(fromBoard, plans) && !isUnder(fromBoard, archive)) {
    return fromBoard
  }
  if (isUnder(fromRoot, plans) && !isUnder(fromRoot, archive)) return fromRoot
  return undefined
}

/**
 * Names the other live tasks whose `Plan:` line lands on the same file. This is
 * the rule `claude-docs` applies before it archives a plan, held here so one
 * question has one implementation: a plan another live task still cites is a
 * plan the sweep is correct to leave, and a guard that read the folder instead
 * refused every task sharing one plan and deadlocked the board against the
 * sweep that was behaving correctly.
 *
 * The closing task is excluded by name. It cites the plan itself, so counting
 * it would never reach zero and the count would answer nothing.
 */
export async function otherTasksCitingPlan(
  dir: string,
  root: string,
  plan: string,
  closing: string,
): Promise<string[]> {
  const stems = (await listTaskStems(dir)).filter((stem) => stem !== closing)

  const read = await Promise.all(
    stems.map(async (stem) => {
      const target = readPlanTarget(
        await readFile(join(dir, `${stem}.md`), 'utf8'),
      )
      const resolved = target && resolveLivePlan(target, dir, root)
      return resolved === plan ? stem : undefined
    }),
  )

  return read.filter((stem): stem is string => stem !== undefined)
}

/**
 * Where a task's `Plan:` target resolves, which is what decides whether the
 * plan is the sweep's to move. `unstated` is a task carrying no line at all,
 * and it is distinct from a line resolving somewhere unexpected.
 */
export const CITATION_LOCATIONS = [
  'unstated',
  'live',
  'archived',
  'outside',
] as const

export type CitationLocation = (typeof CITATION_LOCATIONS)[number]

export interface PlanCitations {
  readonly ok: true
  readonly stem: string
  readonly target: string | undefined
  readonly location: CitationLocation
  /** Other live tasks landing on the same file. Empty unless `location` is `live`. */
  readonly citedBy: readonly string[]
}

export type CitationOutcome = PlanCitations | ArchiveRefused

/**
 * Answers where one task's plan sits and who else holds it, which is the whole
 * of the last-live-citation rule. `claude-docs` reads this rather than scanning
 * the board itself, so the sweep that moves a plan and the gate that refuses a
 * task archive cannot drift into disagreeing about which plan is free.
 *
 * It reports and never writes. The move, the retarget, and the ordering the two
 * happen in belong to the caller, and a verb that performed them would be
 * deciding a question the sweep is there to decide.
 */
export async function planCitations(
  root: string,
  stem: string,
): Promise<CitationOutcome> {
  const dir = tasksDir(root)

  if (!existsSync(dir)) {
    return refuse('no-board', `No task board at ${relative(root, dir)}.`)
  }

  const stems = await listTaskStems(dir)
  if (!stems.includes(stem)) {
    return refuse('no-match', `No task named ${stem} on the board.`, stems)
  }

  const target = readPlanTarget(await readFile(join(dir, `${stem}.md`), 'utf8'))
  if (!target) {
    return {
      ok: true,
      stem,
      target: undefined,
      location: 'unstated',
      citedBy: [],
    }
  }

  const live = resolveLivePlan(target, dir, root)
  if (!live) {
    const location = resolvesUnder(target, dir, root, PLANS_ARCHIVE_DIR)
      ? 'archived'
      : 'outside'
    return { ok: true, stem, target, location, citedBy: [] }
  }

  return {
    ok: true,
    stem,
    target,
    location: 'live',
    citedBy: await otherTasksCitingPlan(dir, root, live, stem),
  }
}

/**
 * Runs the two-spelling resolution `resolveLivePlan` applies against a folder
 * other than the live one, so an archived plan is read as archived whichever
 * root the task wrote its path against.
 */
function resolvesUnder(
  target: string,
  dir: string,
  root: string,
  folder: string,
): boolean {
  const resolved = join(root, folder)

  return (
    isUnder(resolve(dir, target), resolved) ||
    isUnder(resolve(root, target), resolved)
  )
}

export async function listTaskStems(dir: string): Promise<string[]> {
  const entries = await readdir(dir)

  return entries
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => entry.slice(0, -'.md'.length))
    .filter((stem) => !isReservedStem(stem))
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
  const livePlan = planTarget && resolveLivePlan(planTarget, dir, root)

  // A live plan is unswept only when nothing else on the board holds it. A plan
  // several tasks share stays live by design, so refusing on the folder alone
  // parked every one of those tasks behind a sweep that was right to decline.
  if (livePlan) {
    const shared = await otherTasksCitingPlan(dir, root, livePlan, stem)

    if (shared.length === 0) {
      return refuse(
        'plan-unswept',
        `${stem} is the last task pointing at a live plan. Run /claude-docs to sweep it first, then archive.`,
        [planTarget],
      )
    }
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
