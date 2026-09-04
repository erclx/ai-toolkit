import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { regenOne } from '@/indexes/regen'
import { isUnder } from '@/paths'
import { recordDir, recordDirs } from '@/record-root'

const TASKS = 'tasks'
const PLANS = 'plans'
const ARCHIVE = 'archive'

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
  'bad-input',
] as const

export type ArchiveRefusal = (typeof ARCHIVE_REFUSALS)[number]

export type TaskSelector =
  | { readonly kind: 'stem'; readonly stem: string }
  | { readonly kind: 'pull-request'; readonly number: number }

/** A plan carried into the archive alongside the task that was its last citation. */
export interface PlanMove {
  readonly from: string
  readonly to: string
}

export interface ArchiveSuccess {
  readonly ok: true
  readonly stem: string
  readonly from: string
  readonly to: string
  readonly priorityRowRemoved: boolean
  readonly indexRegenerated: boolean
  /** Undefined when the task cited no live plan, or when another task still holds it. */
  readonly plan: PlanMove | undefined
  readonly closed: number
  readonly cut: number
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
  readonly cut: readonly string[]
}

export function tasksDir(root: string): string {
  return recordDir(root, TASKS)
}

export function archiveDir(root: string): string {
  return recordDir(root, TASKS, ARCHIVE)
}

export const OUTCOME_PATTERN = /^- \[([ xX])\] ?(.*)$/

/**
 * A bullet with an optional checkbox, wider than `OUTCOME_PATTERN` so a cut
 * line missing its checkbox still parses. `record.ts` positions outcomes off
 * the narrower pattern and stays that way, so a cut line with no checkbox
 * stays invisible to `canon tasks outcome` by design rather than by oversight.
 *
 * Unlike `OUTCOME_PATTERN`, this reaches a struck bullet under any heading,
 * not only `## Outcomes`, since a checkbox is what confined the narrower
 * pattern there and a cut line may carry none. No struck bullet sits outside
 * `## Outcomes` across the live board or the archive as of this change, so
 * the wider reach is not live, and a heading test is one to add if that stops
 * holding.
 */
const BULLET_PATTERN = /^- (?:\[([ xX])\] ?)?(.*)$/

/**
 * A struck outcome body, whatever its checkbox holds. The test only checks
 * the body's start, since the canonical form trails the struck text with why
 * it was cut: `- ~~<outcome>~~ <why>` leaves `<why>` outside the `~~` pair.
 */
const STRUCK_BODY_PATTERN = /^~~.+~~/

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
 * Splits a task's outcome list by checkbox state, cut outcomes pulled out
 * ahead of it. The board format puts every outcome at the top level of
 * `## Outcomes`, so an anchored match is enough and no heading tracking is
 * needed.
 *
 * A struck body reads as cut whatever its checkbox holds, since a dropped box
 * and a retained one both appear in the tree and neither is the abandoned
 * work's fault: `- ~~a thing~~` carries no box and would otherwise vanish
 * from both arrays, `- [ ] ~~a thing~~` would otherwise read as open, and
 * `- [x] ~~a thing~~` would otherwise read as shipped. Testing the body
 * before the checkbox is what catches all three under one rule.
 */
export function readOutcomes(text: string): TaskOutcomes {
  const open: string[] = []
  const closed: string[] = []
  const cut: string[] = []
  const lines = text.split('\n')
  const fenced = fenceMask(lines)

  for (const [index, line] of lines.entries()) {
    if (fenced[index]) continue

    const bullet = BULLET_PATTERN.exec(line)
    if (!bullet) continue

    const [, box, rawBody] = bullet
    const body = rawBody.trim()

    if (STRUCK_BODY_PATTERN.test(body)) {
      cut.push(body)
      continue
    }

    if (box === undefined) continue

    if (box === ' ') {
      open.push(body)
    } else {
      closed.push(body)
    }
  }

  return { open, closed, cut }
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
 * The `Plan:` line in either form, the link's target captured ahead of the bare
 * path. Padding is spaces and tabs rather than `\s`, which spans a newline, so
 * the match ends at the line and the retarget below cannot swallow the blank
 * line that follows it.
 */
const PLAN_PATTERN = /^Plan:[ \t]*(?:\[[^\]]*\]\(([^)]+)\)|(\S+))[ \t]*$/m

/**
 * Reads the `Plan:` target out of a markdown link, falling back to the older
 * bare-path form. The path is returned as written, relative to the board.
 */
export function readPlanTarget(text: string): string | undefined {
  const match = PLAN_PATTERN.exec(text)
  if (!match) return undefined
  return match[1] ?? match[2]
}

/**
 * Builds a `Plan:` line as a markdown link whose text and target stay in step,
 * the label taken from the target's filename with its extension dropped.
 * `record.ts` reuses this so a plan-link write and an archive retarget produce
 * one line shape rather than two.
 */
export function planLine(target: string): string {
  const name = basename(target)
  const label = name.endsWith('.md') ? name.slice(0, -'.md'.length) : name

  return `Plan: [${label}](${target})`
}

/**
 * Points the task's `Plan:` line at the plan's new home. The line is matched
 * with the pattern the read above uses, so the archive rewrites exactly the
 * line it parsed and never a second `Plan:` a task displays inside a fenced
 * sample.
 *
 * The replacement is built by a function rather than passed as a string,
 * because `$&` and its siblings are substitution sequences inside a replacement
 * string. A plan filename carrying one would write a path nobody typed, and
 * `.canon/plans/` is gitignored, so nothing recovers the pointer it replaced.
 */
export function retargetPlanLine(text: string, target: string): string {
  return text.replace(PLAN_PATTERN, () => planLine(target))
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
 * and `.canon/plans/x.md` as one file, so a gate reading only the first form
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
  // Both roots are tested rather than the one this tree resolves at, since a
  // task's line is a string somebody wrote and a path spelling the root the tree
  // has since left is still a path into the plans folder. Reading it as outside
  // would report a shipped plan as still live.
  const plans = recordDirs(root, PLANS)
  const archives = recordDirs(root, PLANS, ARCHIVE)
  const live = (path: string): boolean =>
    plans.some((dir) => isUnder(path, dir)) &&
    !archives.some((dir) => isUnder(path, dir))
  const fromBoard = resolve(dir, target)
  const fromRoot = resolve(root, target)

  if (live(fromBoard)) return atOneRoot(fromBoard, plans, root)
  if (live(fromRoot)) return atOneRoot(fromRoot, plans, root)
  return undefined
}

/**
 * Restates a live plan path at the root this tree actually resolves, so two
 * tasks naming one plan through different roots compare equal.
 *
 * Callers compare the return of `resolveLivePlan` by string. Both roots are
 * accepted above, so without this a task citing `.canon/plans/x.md` and one
 * citing `.canon/plans/x.md` name one file and read as two, which counts a
 * sibling's citation as absent and refuses the archive it should allow.
 */
function atOneRoot(path: string, plans: string[], root: string): string {
  const at = plans.find((dir) => isUnder(path, dir))

  return at === undefined
    ? path
    : join(recordDir(root, PLANS), relative(at, path))
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
    const unmatched = describeUnmatchedStem(stems, stem)
    return refuse(unmatched.reason, unmatched.message, unmatched.detail)
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
    const location = resolvesUnder(
      target,
      dir,
      root,
      recordDirs(root, PLANS, ARCHIVE),
    )
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
 * Runs the two-base resolution `resolveLivePlan` applies against folders other
 * than the live ones, so an archived plan is read as archived whichever base the
 * task wrote its path against and whichever record root it spelled.
 */
function resolvesUnder(
  target: string,
  dir: string,
  root: string,
  dirs: readonly string[],
): boolean {
  const fromBoard = resolve(dir, target)
  const fromRoot = resolve(root, target)

  return dirs.some(
    (resolved) => isUnder(fromBoard, resolved) || isUnder(fromRoot, resolved),
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

export interface UnmatchedStem {
  readonly reason: 'no-match' | 'ambiguous'
  readonly message: string
  readonly detail: readonly string[]
}

/**
 * The three-way refusal a bare stem earns once it fails an exact match:
 * exactly one task starts with it, several do, or none does. `archive.ts`'s
 * own `resolveStem`, `planCitations`, and `record.ts`'s `resolveStem` all
 * refuse a stem this way, so the wording lives once rather than three times.
 */
export function describeUnmatchedStem(
  stems: readonly string[],
  name: string,
): UnmatchedStem {
  const prefixed = stems.filter((stem) => stem.startsWith(name))
  if (prefixed.length === 1) {
    const [match] = prefixed
    return {
      reason: 'no-match',
      message: `${name} does not name a task by itself. One task starts with it: ${match}. Pass the full name instead.`,
      detail: [match],
    }
  }
  if (prefixed.length > 1) {
    return {
      reason: 'ambiguous',
      message: `${name} does not name a task by itself. ${prefixed.length} tasks start with it. Pass the full name instead.`,
      detail: prefixed,
    }
  }
  return {
    reason: 'no-match',
    message: `No task named ${name} on the board.`,
    detail: stems,
  }
}

async function resolveStem(
  dir: string,
  selector: TaskSelector,
): Promise<string | ArchiveRefused> {
  const stems = await listTaskStems(dir)

  if (selector.kind === 'stem') {
    if (!stems.includes(selector.stem)) {
      const { reason, message, detail } = describeUnmatchedStem(
        stems,
        selector.stem,
      )
      return refuse(reason, message, detail)
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

  const { open, closed, cut } = readOutcomes(text)

  if (open.length > 0) {
    return refuse(
      'open-outcomes',
      `${stem} has ${open.length} open outcome(s). Close them, or cut one with \`- ~~<outcome>~~ <why>\`, then archive.`,
      open,
    )
  }

  if (closed.length === 0 && cut.length === 0) {
    return refuse(
      'no-outcomes',
      `${stem} carries no outcomes, so nothing marks it shipped.`,
    )
  }

  const plan = await planToArchive(dir, root, stem, text)
  const destination = archiveDir(root)
  const to = join(destination, `${stem}.md`)

  // The plan moves first so the line written below describes a file already at
  // its new path. Writing the retarget first and failing the move would leave a
  // pointer at a folder holding nothing, and `.canon/plans/` is gitignored, so
  // no history recovers the target it named.
  if (plan) {
    await mkdir(dirname(plan.to), { recursive: true })
    await rename(plan.from, plan.to)
  }

  await mkdir(destination, { recursive: true })
  await rename(from, to)
  if (plan)
    await writeFile(to, retargetPlanLine(text, linkTo(destination, plan.to)))

  const priorityRowRemoved = await clearPriorityRow(dir, stem)
  const regen = await regenOne(dir, { dryRun: false })

  return {
    ok: true,
    stem,
    from,
    to,
    priorityRowRemoved,
    indexRegenerated: regen.action === 'written',
    plan,
    closed: closed.length,
    cut: cut.length,
  }
}

/**
 * The plan this task carries into the archive with it, or nothing. The merge is
 * what settles a plan, and the hook reaches this with nobody watching, so the
 * move sits inside the archive rather than in a second call that could leave
 * the task archived and the plan live.
 *
 * A plan another live task still cites stays where it is. Moving it on the
 * first task to close strands every other pointer at a path that has gone, and
 * the sibling has no history behind it to repair the line from.
 *
 * A target resolving to no file yields nothing too. A pointer somebody typed
 * wrong is not a plan to move, and refusing the whole archive over it would
 * park the board behind a repair the merge cannot make.
 */
async function planToArchive(
  dir: string,
  root: string,
  stem: string,
  text: string,
): Promise<PlanMove | undefined> {
  const target = readPlanTarget(text)
  const live = target && resolveLivePlan(target, dir, root)
  if (!live || !existsSync(live)) return undefined

  const shared = await otherTasksCitingPlan(dir, root, live, stem)
  if (shared.length > 0) return undefined

  return {
    from: live,
    to: join(recordDir(root, PLANS, ARCHIVE), basename(live)),
  }
}

/**
 * The archived plan as the archived task cites it. Both halves land a folder
 * deeper than the live pair, so the link is measured between the two
 * destinations rather than written as the `../plans/` the live task carried.
 */
export function linkTo(taskDir: string, plan: string): string {
  return relative(taskDir, plan).split(sep).join('/')
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
