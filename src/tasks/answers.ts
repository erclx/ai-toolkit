import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { isUnder } from '@/paths'
import { recordDir, recordDirs } from '@/record-root'
import {
  normalizeOperatorCall,
  OPERATOR_CALL,
  readQuestions,
  splitPlanSections,
} from '@/records/validate'

const PLANS = 'plans'
const TASKS = 'tasks'
const ARCHIVE = 'archive'

const SUGGESTED_PREFIX = '- Suggested:'
const ANSWER_PREFIX = '- Answer:'

export const ANSWER_REFUSALS = ['no-plan', 'archived', 'bad-input'] as const

export type AnswerRefusal = (typeof ANSWER_REFUSALS)[number]

export interface AnswersRefused {
  readonly ok: false
  readonly reason: AnswerRefusal
  readonly message: string
  readonly detail: readonly string[]
}

/**
 * One question the dispatch has to hand back. It carries the label rather than
 * contributing to a count, since a dispatcher that refuses a row without naming
 * the slot has nothing to give the operator.
 */
export interface OpenQuestion {
  readonly label: string
  readonly why: string
}

export interface PlanAnswers {
  readonly ok: true
  readonly plan: string
  readonly launchable: boolean
  readonly open: readonly OpenQuestion[]
}

export type AnswersOutcome = PlanAnswers | AnswersRefused

/**
 * The spellings a caller reaches a plan by, in the order they are tried. A bare
 * slug names the live folder outright, and a path is resolved against the
 * project root and against the board directory both.
 *
 * The second base is the one a dispatcher actually has to hand. A board row
 * writes its `Plan:` link relative to `.canon/tasks/`, so the href reads
 * `../plans/feature-<slug>.md`, and resolving that against the root alone lands
 * a directory above the repository and refuses a plan that exists.
 *
 * `resolveLivePlan` reads a task's own line against the same two bases and is
 * not this function. It tries the board first and tests containment under the
 * live plans folder, where this tries the root first and tests nothing, so the
 * two agree on the spellings a board writes and part company outside them.
 * Sharing the bases is what makes a board link resolve for both, and the
 * archive exclusion in `planAnswers` is stated separately for that reason.
 *
 * Root order is what keeps the documented forms unchanged. A reference that
 * resolves from the root is taken there, and the board base is reached only by
 * a path the root could not answer.
 */
export function planCandidates(root: string, reference: string): string[] {
  if (reference.includes('/') || reference.endsWith('.md')) {
    if (isAbsolute(reference)) return [reference]

    return [
      resolve(root, reference),
      resolve(recordDir(root, TASKS), reference),
    ]
  }

  const slug = reference.startsWith('feature-')
    ? reference.slice('feature-'.length)
    : reference

  return [recordDir(root, PLANS, `feature-${slug}.md`)]
}

function suggestionOf(body: readonly string[]): string | undefined {
  const line = body.find((entry) => entry.startsWith(SUGGESTED_PREFIX))

  return line?.slice(SUGGESTED_PREFIX.length).trim()
}

/**
 * An absent `- Answer:` line reads the same as a blank one here. The slot being
 * missing is a conformance defect `canon tasks validate` already names, and a
 * gate that answered it differently would refuse a row for a reason the
 * validator has already reported.
 */
function isAnswered(body: readonly string[]): boolean {
  const line = body.find((entry) => entry.startsWith(ANSWER_PREFIX))
  if (line === undefined) return false

  return line.slice(ANSWER_PREFIX.length).trim().length > 0
}

/**
 * The standard writes the reason behind a comma and the corpus also writes it
 * behind a full stop, so both separators come off. Reporting the phrase with
 * whatever punctuation followed it hands the operator a stray mark where the
 * reason should start.
 *
 * Takes the normalized suggestion rather than the raw one, so the length
 * stripped from the front is always `OPERATOR_CALL`'s own regardless of which
 * recognized wording the author wrote. The `operator's call` and
 * `the operator's call` variants read longer than `your call`, and slicing by
 * the canonical length against the raw text would cut into the reason itself.
 */
function reasonOf(normalized: string): string {
  const rest = normalized.slice(OPERATOR_CALL.length).replace(/^[,.;:\s]+/, '')

  return rest.length > 0 ? rest : 'no reason stated'
}

/**
 * A question carrying no suggestion at all is also a stop at execution, and it
 * is not read here. `checkQuestionContract` reports it as `suggestion-missing`
 * and the runbook dispatches a row whose plan is already verified, so testing
 * it again would put one rule in two places that ship on different cadences.
 */
function openQuestions(lines: readonly string[]): OpenQuestion[] {
  const open: OpenQuestion[] = []

  for (const question of readQuestions(lines)) {
    const suggested = suggestionOf(question.body)
    if (!suggested) continue

    const normalized = normalizeOperatorCall(suggested)
    if (!normalized.toLowerCase().startsWith(OPERATOR_CALL)) continue
    if (isAnswered(question.body)) continue

    open.push({ label: question.label, why: reasonOf(normalized) })
  }

  return open
}

/**
 * Answers whether a plan is launchable, which is whether it still waits on the
 * operator for a call only they can make. It reads the question block through
 * the same `readQuestions` the plan validator runs, so the gate and the
 * conformance check cannot drift into disagreeing about what a question is.
 *
 * It reports and never writes. Holding the row, naming the slot, and reaching
 * the operator belong to the dispatcher, which is where the decision already
 * sits.
 */
export async function planAnswers(
  root: string,
  reference: string,
): Promise<AnswersOutcome> {
  if (reference.trim().length === 0) {
    return refuse('bad-input', 'No plan named. Pass a plan path or its slug.')
  }

  const candidates = planCandidates(root, reference)
  const path = candidates.find((candidate) => existsSync(candidate))

  if (!path) {
    // Naming every base keeps a task-relative link from reporting the one place
    // it does not resolve, since `relative` hands that spelling straight back.
    const looked = candidates.map((entry) => relative(root, entry)).join(' or ')

    return refuse('no-plan', `No plan at ${looked}.`, [reference])
  }

  // An archived plan answers every question and would report as launchable, so
  // the name would clear a dispatch that `claude-autoship` Step 1 then refuses
  // as already-shipped work. Catching it here is a step earlier than the worker.
  // Both roots, for the reason `resolveLivePlan` carries: the reference is a
  // string a caller wrote, and one spelling the root this tree has since left is
  // still a path into the archive.
  if (recordDirs(root, PLANS, ARCHIVE).some((dir) => isUnder(path, dir))) {
    return refuse(
      'archived',
      `${relative(root, path)} sits in the plans archive, so it describes work that already shipped.`,
      [reference],
    )
  }

  const sections = splitPlanSections(await readFile(path, 'utf8'))
  const open = openQuestions(sections.get('Questions') ?? [])

  return {
    ok: true,
    plan: relative(root, path),
    launchable: open.length === 0,
    open,
  }
}

function refuse(
  reason: AnswerRefusal,
  message: string,
  detail: readonly string[] = [],
): AnswersRefused {
  return { ok: false, reason, message, detail }
}
