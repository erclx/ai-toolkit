import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { readQuestions, splitPlanSections } from '@/records/validate'

const PLANS_DIR = join('.claude', 'plans')

/**
 * The suggestion the plan standard fixes for a question that turns on the
 * operator's preference rather than on a technical default. Every other
 * suggestion is accepted by a blank slot, so only this phrase over an empty
 * `- Answer:` is a stop.
 */
const OPERATOR_CALL = 'needs your call'

const SUGGESTED_PREFIX = '- Suggested:'
const ANSWER_PREFIX = '- Answer:'

export const ANSWER_REFUSALS = ['no-plan', 'bad-input'] as const

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
 * Resolves the two spellings a caller reaches a plan by, which are the path a
 * board row writes and the bare slug a branch carries. A reference naming a
 * folder or an extension is taken as given, and everything else is a slug.
 */
export function planPath(root: string, reference: string): string {
  if (reference.includes('/') || reference.endsWith('.md')) {
    return isAbsolute(reference) ? reference : resolve(root, reference)
  }

  const slug = reference.startsWith('feature-')
    ? reference.slice('feature-'.length)
    : reference

  return join(root, PLANS_DIR, `feature-${slug}.md`)
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
 */
function reasonOf(suggested: string): string {
  const rest = suggested.slice(OPERATOR_CALL.length).replace(/^[,.;:\s]+/, '')

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
    if (!suggested?.toLowerCase().startsWith(OPERATOR_CALL)) continue
    if (isAnswered(question.body)) continue

    open.push({ label: question.label, why: reasonOf(suggested) })
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

  const path = planPath(root, reference)

  if (!existsSync(path)) {
    return refuse('no-plan', `No plan at ${relative(root, path)}.`, [reference])
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
