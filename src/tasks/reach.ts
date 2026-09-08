import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { listChangedFiles, resolveBaseRef } from '@/git-files'
import { recordDir } from '@/record-root'
import { splitPlanSections } from '@/records/validate'
import { type AnswersRefused, resolvePlanReference } from '@/tasks/answers'
import { orderingPath, readBoard } from '@/tasks/validate'

const PLANS = 'plans'
const MARKDOWN = '.md'
const NONE_IDENTIFIED = 'None identified.'

/** The one group a dispatch reads, per `standards/tasks.md`. */
const DISPATCH_GROUP = 'Run now'

export const REACH_REFUSALS = [
  'no-plan',
  'archived',
  'bad-input',
  'no-base',
  'no-diff',
] as const

export type ReachRefusal = (typeof REACH_REFUSALS)[number]

export interface ReachRefused {
  readonly ok: false
  readonly reason: ReachRefusal
  readonly message: string
  readonly detail: readonly string[]
}

/**
 * One changed path another track already holds, carrying who holds it and the
 * declaration that matched. A count alone leaves the reader diffing two file
 * lists by eye to find which pair collided.
 */
export interface Claim {
  readonly path: string
  /** The holding plan's filename stem, or the holding row's task label. */
  readonly holder: string
  readonly source: 'plan' | 'row'
  readonly declaration: string
}

export interface ReachReport {
  readonly ok: true
  readonly plan: string
  readonly base: string
  readonly changed: number
  readonly declared: readonly string[]
  /** Leads the report. Short on nearly every branch, and the half worth acting on. */
  readonly claimed: readonly Claim[]
  readonly undeclared: readonly string[]
  /** Live plans compared against, this branch's own excluded. */
  readonly plans: number
  /** `## Run now` rows compared against, the row citing this plan excluded. */
  readonly rows: number
  /** Whether an ordering file was on disk to read rows from at all. */
  readonly board: boolean
}

export type ReachOutcome = ReachReport | ReachRefused

export interface ReachOptions {
  /**
   * Where the git range is read, defaulting to the records root.
   *
   * The two part company on every ordinary run, since the plans and the board
   * are shared scratch at the main worktree root while the branch's own commits
   * are in a linked worktree. Reading the range at the records root there
   * measures a checkout sitting on the trunk, so the range closes on itself and
   * every branch reports a reach of nothing. `canon gov test-order` carries the
   * same split as an instruction in a skill body; this one is a parameter.
   */
  readonly repo?: string
  /** The far side of the range, defaulting to the trunk. */
  readonly ref?: string
}

/**
 * Splits an entry at the colon that opens its reason, which is the first one
 * standing outside a backticked span.
 *
 * The span test is what keeps `canon:docs-sync` and a `<slug>: <title>` label
 * from ending the subject early, and it is the ordinary case rather than a
 * corner: a reason routinely names a skill, and a skill is spelled with a
 * colon inside backticks.
 */
function subjectOf(entry: string): string {
  let fenced = false

  for (let i = 0; i < entry.length; i += 1) {
    const char = entry[i]
    if (char === '`') fenced = !fenced
    else if (char === ':' && !fenced) return entry.slice(0, i)
  }

  return entry
}

/**
 * Whether a span names a file rather than a skill, a command, or a version.
 * It is `readPaths`' test, held here rather than shared, because that function
 * reads a whole cell where this reads one already-split subject.
 */
function namesFile(span: string): boolean {
  return span.includes('/') || /\.[A-Za-z][A-Za-z0-9]*$/.test(span)
}

/**
 * Reads the paths a plan declares out of its `**Files to touch:**` section.
 *
 * A declaration is a backticked span standing as an entry's subject, ahead of
 * the colon opening its reason. Reading every span in the entry was the
 * alternative and it reports a pair that was never going to collide, since the
 * standard invites an entry to explain itself and an explanation names other
 * files: one archived plan cites `src/gate/measures.ts` inside a reason whose
 * subject is a sandbox arm, and never wrote it. Measured over the 2026-09-08
 * wave, the subject rule reports 6 crossing pairs against 14 for every span.
 *
 * An entry carrying no colon at all is taken whole. The standard requires a
 * reason rather than the punctuation introducing it, so the alternative is
 * reading such an entry as declaring nothing, which reports every path it
 * names as undeclared. `standards/plan.md` fixes the colon form, so the
 * conforming entry never reaches this fallback.
 *
 * A rename declares both sides, since both are paths the branch writes and
 * both sit ahead of the colon.
 */
export function readDeclarations(text: string): string[] {
  const section = splitPlanSections(text).get('Files to touch') ?? []
  const declared: string[] = []

  for (const line of section) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('- ') || trimmed === `- ${NONE_IDENTIFIED}`)
      continue

    const spans = subjectOf(trimmed.slice(2)).match(/`[^`]+`/g) ?? []

    for (const span of spans) {
      const path = span
        .slice(1, -1)
        .trim()
        .replace(/^\.\//, '')
        .replace(/\/+$/, '')

      if (namesFile(path)) declared.push(path)
    }
  }

  return [...new Set(declared)]
}

/**
 * Whether a declaration covers a changed path: the same file, or a folder the
 * file sits under.
 *
 * Containment runs one way only. A changed path is always a file, so a
 * declaration of `src/tasks/reach.ts` covering a change to `src/tasks/other.ts`
 * would be the folder claim its author did not write, and the board's own
 * `sharesPath` reads both directions because two rows can each name a folder.
 */
function covers(declaration: string, path: string): boolean {
  return path === declaration || path.startsWith(`${declaration}/`)
}

function stemOf(path: string): string {
  return basename(path, MARKDOWN)
}

/**
 * Every live plan beside this one, as a stem and the paths it declares. The
 * archive is a folder below this one and is never walked, so a shipped plan
 * cannot claim a path against a branch building today.
 */
async function otherPlans(
  root: string,
  own: string,
): Promise<{ stem: string; declared: readonly string[] }[]> {
  const dir = recordDir(root, PLANS)
  if (!existsSync(dir)) return []

  const names = (await readdir(dir)).filter(
    (name) => name.endsWith(MARKDOWN) && name !== basename(own),
  )
  names.sort()

  const plans = []
  for (const name of names) {
    const text = await readFile(join(dir, name), 'utf8')
    plans.push({ stem: stemOf(name), declared: readDeclarations(text) })
  }

  return plans
}

/**
 * Every `## Run now` cell beside this branch's own row. A cell is copied from a
 * plan's own list, so the board catches a row whose plan is absent and the
 * plans folder catches a claim no cell carried.
 */
async function dispatchRows(
  root: string,
  own: string,
): Promise<{ read: boolean; rows: { label: string; touches: string[] }[] }> {
  const ordering = orderingPath(root)
  if (!existsSync(ordering)) return { read: false, rows: [] }

  const { rows } = readBoard(await readFile(ordering, 'utf8'))
  const ownStem = stemOf(own)

  return {
    read: true,
    rows: rows
      .filter((row) => row.group === DISPATCH_GROUP)
      .filter((row) => row.plan === undefined || stemOf(row.plan) !== ownStem)
      .map((row) => ({
        label: row.label,
        touches: [...(row.touches ?? [])],
      })),
  }
}

function claimsFor(
  path: string,
  plans: readonly { stem: string; declared: readonly string[] }[],
  rows: readonly { label: string; touches: readonly string[] }[],
): Claim[] {
  const claims: Claim[] = []

  for (const plan of plans) {
    const declaration = plan.declared.find((entry) => covers(entry, path))
    if (declaration !== undefined) {
      claims.push({ path, holder: plan.stem, source: 'plan', declaration })
    }
  }

  for (const row of rows) {
    const declaration = row.touches.find((entry) => covers(entry, path))
    if (declaration !== undefined) {
      claims.push({ path, holder: row.label, source: 'row', declaration })
    }
  }

  return claims
}

/**
 * Reads a branch back against what was written down about it: the paths its own
 * plan declared, and the paths every other live plan or dispatch row holds.
 *
 * It reports and never gates, the way `canon gov test-order` does, and it
 * writes nothing. A `Touches` cell is the controller's to correct and a plan's
 * list is a prediction the branch outgrows, so a verb that repaired either
 * would be answering a question the reader has not been shown yet.
 *
 * What it reads is what is written down, so it inherits the dispatch runbook's
 * own blindness. A hand-launched track carries no row and a track with no plan
 * carries no declaration, which is why the report names how many plans and rows
 * it compared against rather than reporting clear and letting that read as a
 * proof.
 *
 * The live folder is trusted rather than tested, which cuts the other way: a
 * plan whose work merged keeps claiming its files until something archives it,
 * and `canon tasks archive` only runs on merge, so a stranded plan reports a
 * collision against every branch after it. The first run of this verb reported
 * five such paths and every one was a file nobody archived. Testing a holder for
 * liveness would put a second reading of what is in flight here, beside the
 * dispatch gate's own, so the report names the holder and the reader decides.
 */
export async function planReach(
  root: string,
  reference: string,
  { repo = root, ref }: ReachOptions = {},
): Promise<ReachOutcome> {
  const resolved = resolvePlanReference(root, reference)
  if (!resolved.ok) return widen(resolved)

  const base = await resolveBaseRef(repo, ref)
  if (base === undefined) {
    return refuse(
      'no-base',
      `No merge base against ${ref ?? 'origin/main or main'}, so the branch has no range to read.`,
      [reference],
    )
  }

  const changed = await listChangedFiles(repo, base)
  if (changed === undefined) {
    return refuse(
      'no-diff',
      `git could not list the files changed since ${base}, so the reach is unread rather than clear.`,
      [reference],
    )
  }

  const declared = readDeclarations(await readFile(resolved.path, 'utf8'))
  const plans = await otherPlans(root, resolved.path)
  const board = await dispatchRows(root, resolved.path)

  const claimed: Claim[] = []
  const undeclared: string[] = []

  for (const path of changed) {
    claimed.push(...claimsFor(path, plans, board.rows))
    if (!declared.some((entry) => covers(entry, path))) undeclared.push(path)
  }

  return {
    ok: true,
    plan: resolved.plan,
    base,
    changed: changed.length,
    declared,
    claimed,
    undeclared,
    plans: plans.length,
    rows: board.rows.length,
    board: board.read,
  }
}

/**
 * Carries a resolution refusal through unchanged. The reasons are a subset of
 * this verb's own, so restating the message here would put one wording in two
 * places that ship together.
 */
function widen(refused: AnswersRefused): ReachRefused {
  return refused
}

function refuse(
  reason: ReachRefusal,
  message: string,
  detail: readonly string[] = [],
): ReachRefused {
  return { ok: false, reason, message, detail }
}
