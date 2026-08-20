import type { ValidateRefusal as RecordRefusal } from '@/records/validate'
import type { ValidateRefusal as BoardRefusal } from '@/tasks/validate'

/**
 * The audits this repository already owns, and how to read each one's record.
 *
 * Every verb here ships its own `--json` shape with its own keys, and this
 * module reads each shape rather than forcing a common envelope on them. Each
 * record already has consumers, so an envelope would be a breaking change to
 * every one of them bought for tidiness.
 */

/** How far a finding from this audit reaches. */
export type Corpus =
  /** Committed, so every clone measures the same files and a delta is shared. */
  | 'tracked'
  /** Gitignored session scratch, so the numbers are one machine's alone. */
  | 'per-machine'

export type AuditStatus =
  /** The audit reported and every count it produced is zero. */
  | 'clean'
  /** The audit reported findings it does not gate on. */
  | 'reported'
  /** The audit reported a finding that is a fact, which fails the aggregate. */
  | 'finding'
  /**
   * The per-machine corpus this audit reads is not on this disk, which is the
   * ordinary state of a gitignored folder on a fresh clone and in CI.
   */
  | 'absent'
  /** The audit did not report, so the aggregate measured less than the set. */
  | 'unmeasured'

export interface AuditSpec {
  readonly id: string
  readonly label: string
  /** Arguments after `aitk`, always ending in `--json`. */
  readonly argv: readonly string[]
  /**
   * Exit codes this verb sets on a finding that is a fact.
   *
   * Empty for every verb whose findings are judgments. The catalog decides
   * this rather than the exit code, because a reporting verb sets 2 on
   * findings it deliberately does not gate on, so the code alone cannot say
   * whether a finding is a fact.
   */
  readonly gatingExits: readonly number[]
  readonly corpus: Corpus
  /**
   * Pulls the counts worth retaining out of this verb's record.
   *
   * Returns `undefined` when the record does not carry the keys it reads,
   * which is a measure that did not run rather than a corpus with nothing in
   * it. Zero there would read as clean, which is the two-states-look-alike
   * defect this repository has already fixed elsewhere.
   */
  readonly counts: (record: unknown) => Record<string, number> | undefined
}

export interface AuditResult {
  readonly id: string
  readonly label: string
  readonly status: AuditStatus
  readonly tracked: boolean
  readonly exitCode: number
  readonly counts?: Record<string, number>
  /** Why the audit did not report, present only on `unmeasured`. */
  readonly reason?: string
}

/** The exit code every command here sets when it refuses. */
const EXIT_REFUSED = 1

/** The exit code every command here sets when it carries findings. */
const EXIT_FINDINGS = 2

function asObject(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

function lengthOf(value: unknown): number | undefined {
  return Array.isArray(value) ? value.length : undefined
}

/**
 * Folds a set of per-key readings into one record, or `undefined` when any of
 * them could not be read. One unreadable key means the record is not the shape
 * the extractor was written against, and reporting the rest would publish a
 * partial count under a name that claims to be whole.
 */
function allOf(
  readings: Record<string, number | undefined>,
): Record<string, number> | undefined {
  const counts: Record<string, number> = {}
  for (const [key, value] of Object.entries(readings)) {
    if (value === undefined) return undefined
    counts[key] = value
  }
  return counts
}

/**
 * Reads the architecture record's three measures, or nothing when the project
 * carries no record.
 *
 * Three states rather than two, matching what the verb publishes. The key
 * absent is a run that never opened the record, which the aggregate never asks
 * for and so reads as a shape that moved. Null is a project entitled to carry
 * no record, whose other context counts still stand, so it contributes no key
 * rather than a zero that would read as a conforming record.
 */
function architectureCounts(
  root: Record<string, unknown>,
): Record<string, number> | undefined | 'absent' {
  if (!('architecture' in root)) return undefined
  if (root.architecture === null) return 'absent'

  const record = asObject(root.architecture)
  const decisions = record?.decisions
  if (
    record === undefined ||
    !Array.isArray(decisions) ||
    typeof record.lines !== 'number' ||
    typeof record.ceiling !== 'number'
  ) {
    return undefined
  }

  let unverifiable = 0
  let unchecked = 0
  for (const raw of decisions) {
    const entry = asObject(raw)
    const claim = entry?.claim
    const checks = lengthOf(entry?.checks)
    if (typeof claim !== 'string' || checks === undefined) return undefined

    if (claim === 'neither') unverifiable += 1
    else if (checks === 0) unchecked += 1
  }

  return {
    // A boolean, counted so the aggregate reads it the way it reads every
    // other measure. The verb gates on it separately.
    recordOverLength: record.lines > record.ceiling ? 1 : 0,
    recordUnverifiable: unverifiable,
    recordUnchecked: unchecked,
  }
}

function contextCounts(record: unknown): Record<string, number> | undefined {
  const root = asObject(record)
  if (root === undefined) return undefined

  const entries = root.entries
  if (!Array.isArray(entries)) return undefined

  let bareReferences = 0
  for (const entry of entries) {
    const bare = lengthOf(asObject(entry)?.bareReferences)
    if (bare === undefined) return undefined
    bareReferences += bare
  }

  const architecture = architectureCounts(root)
  if (architecture === undefined) return undefined

  const counts = allOf({
    unresolvedCitations: lengthOf(asObject(root.citations)?.unresolved),
    longEntries: lengthOf(root.length),
    missingSections: lengthOf(root.missingSections),
    indexDrift: lengthOf(root.indexDrift),
    bareReferences,
  })

  if (counts === undefined) return undefined
  return architecture === 'absent' ? counts : { ...counts, ...architecture }
}

function markdownCounts(record: unknown): Record<string, number> | undefined {
  const root = asObject(record)
  if (root === undefined) return undefined

  const entries = root.entries
  if (!Array.isArray(entries)) return undefined

  const depth = asObject(root.checkpoints)?.run
  // A depth reading needs the checkpoint it is measured against. Counting zero
  // without it reports a corpus nobody measured for depth as one with no file
  // past the line.
  if (entries.length > 0 && typeof depth !== 'number') return undefined

  let bans = 0
  let heavyBullets = 0
  let heavyParagraphs = 0
  let filesPastDepth = 0
  let flatParagraphs = 0

  for (const raw of entries) {
    const entry = asObject(raw)
    if (entry === undefined) return undefined

    const entryBans = lengthOf(entry.bans)
    const bullets = lengthOf(entry.heavyBullets)
    const paragraphs = lengthOf(entry.heavyParagraphs)
    const run = entry.longestRun
    if (
      entryBans === undefined ||
      bullets === undefined ||
      paragraphs === undefined ||
      typeof run !== 'number'
    ) {
      return undefined
    }

    bans += entryBans
    heavyBullets += bullets
    heavyParagraphs += paragraphs
    if (typeof depth === 'number' && run > depth) filesPastDepth += 1

    // A file below the measuring floor carries no cadence key at all, which is
    // a file that was not measured rather than one with no flat paragraph.
    const flat = asObject(entry.cadence)?.flat
    if (typeof flat === 'number') flatParagraphs += flat
  }

  return { bans, heavyBullets, heavyParagraphs, filesPastDepth, flatParagraphs }
}

/** The finding arrays `aitk claude skills audit` publishes, in its own order. */
const SKILL_FINDINGS = [
  'missingRequirement',
  'nameMismatch',
  'missingDescription',
  'longDescription',
  'readme',
  'folderName',
  'requirementSections',
] as const

function skillCounts(record: unknown): Record<string, number> | undefined {
  const findings = asObject(asObject(record)?.findings)
  if (findings === undefined) return undefined

  return allOf(
    Object.fromEntries(
      SKILL_FINDINGS.map((key) => [key, lengthOf(findings[key])]),
    ),
  )
}

function boardCounts(record: unknown): Record<string, number> | undefined {
  const root = asObject(record)
  if (root === undefined) return undefined

  // The board keeps its untested rows apart from its findings on purpose, so
  // they move no exit code. Folding them together here would undo that.
  return allOf({
    findings: lengthOf(root.findings),
    untested: lengthOf(root.untested),
  })
}

function findingsOnly(record: unknown): Record<string, number> | undefined {
  const root = asObject(record)
  if (root === undefined) return undefined

  return allOf({ findings: lengthOf(root.findings) })
}

function commentCounts(record: unknown): Record<string, number> | undefined {
  const snapshot = asObject(record)?.snapshot
  if (!Array.isArray(snapshot)) return undefined

  let degradationHits = 0
  for (const language of snapshot) {
    const hits = lengthOf(asObject(language)?.degradationHits)
    if (hits === undefined) return undefined
    degradationHits += hits
  }

  return { degradationHits }
}

function testOrderCounts(record: unknown): Record<string, number> | undefined {
  const root = asObject(record)
  if (root === undefined) return undefined

  // The unclassified count travels with the findings because it is the honest
  // shape of this measure: a refactor and a new behavior cannot be told apart
  // from history, and a findings count alone claims coverage it does not have.
  return allOf({
    findings: lengthOf(root.findings),
    unclassified: lengthOf(root.unclassified),
  })
}

/** The record kinds `aitk records validate` takes, and the corpus each reads. */
const RECORD_KINDS: readonly (readonly [string, Corpus])[] = [
  ['plans', 'per-machine'],
  ['groundwork', 'per-machine'],
  ['intake', 'per-machine'],
  ['memory', 'per-machine'],
  ['standards', 'tracked'],
  ['teach', 'per-machine'],
]

/**
 * Every audit the aggregate runs.
 *
 * `context`, `markdown`, and `skills` are the three that gate, which is exactly
 * the set `scripts/core/verify.sh` already fails a push on. Adding a fourth
 * here widens what fails a push without anyone deciding to, and the split this
 * repository records gates a fact and reports a judgment.
 *
 * Each verb runs once in its fullest form. Running the gating half separately
 * would walk the same tree twice for a number the full record already carries.
 */
export const AUDITS: readonly AuditSpec[] = [
  {
    id: 'context',
    label: 'Context folders',
    argv: ['context', 'audit', '--json'],
    gatingExits: [EXIT_FINDINGS],
    corpus: 'tracked',
    counts: contextCounts,
  },
  {
    id: 'markdown',
    label: 'Markdown corpus',
    argv: ['markdown', 'audit', '--json'],
    // 3 is the empty ban set, which is the corpus walked with nothing looked
    // for. That is a broken check rather than a clean tree, so it fails here
    // the way it already fails the push.
    gatingExits: [EXIT_FINDINGS, 3],
    corpus: 'tracked',
    counts: markdownCounts,
  },
  {
    id: 'skills',
    label: 'Skill corpora',
    argv: ['claude', 'skills', 'audit', '--json'],
    gatingExits: [EXIT_FINDINGS],
    corpus: 'tracked',
    counts: skillCounts,
  },
  {
    id: 'tasks',
    label: 'Task board',
    argv: ['tasks', 'validate', '--json'],
    gatingExits: [],
    corpus: 'per-machine',
    counts: boardCounts,
  },
  ...RECORD_KINDS.map(([kind, corpus]) => ({
    id: `records-${kind}`,
    label: `Records: ${kind}`,
    argv: ['records', 'validate', kind, '--json'],
    gatingExits: [],
    corpus,
    counts: findingsOnly,
  })),
  {
    id: 'comments',
    label: 'Comment census',
    argv: ['comments', 'scan', '--json'],
    gatingExits: [],
    corpus: 'tracked',
    counts: commentCounts,
  },
  {
    id: 'test-order',
    label: 'Test order',
    argv: ['gov', 'test-order', '--json'],
    gatingExits: [],
    corpus: 'tracked',
    counts: testOrderCounts,
  },
]

export function auditFor(id: string): AuditSpec | undefined {
  return AUDITS.find((audit) => audit.id === id)
}

export function isTracked(spec: AuditSpec): boolean {
  return spec.corpus === 'tracked'
}

export function countsFor(
  spec: AuditSpec,
  record: unknown,
): Record<string, number> | undefined {
  return spec.counts(record)
}

/**
 * Reads the reason a refusing verb published, so the aggregate names the cause
 * rather than only the exit. Every command here puts it in `reason`, and the
 * ones that also carry a sentence put that in `message`.
 */
function refusalReason(record: unknown, exitCode: number): string {
  const root = asObject(record)
  const reason = typeof root?.reason === 'string' ? root.reason : undefined
  const message = typeof root?.message === 'string' ? root.message : undefined

  if (reason !== undefined && message !== undefined) {
    return `${reason}: ${message}`
  }
  return reason ?? message ?? `exited ${exitCode} with no reason on stdout`
}

/**
 * The reasons a verb publishes when the folder it reads is simply not there.
 *
 * Typed against the unions those two verbs export rather than spelled as bare
 * strings, so renaming a reason at its source fails this build. A literal here
 * would go on matching nothing and quietly turn every expected absence back
 * into an unmeasured audit.
 */
const ABSENT_REASONS: readonly (RecordRefusal | BoardRefusal)[] = [
  'no-folder',
  'no-board',
]

/**
 * Whether a refusal is a folder this machine never created rather than a break.
 *
 * Every gitignored record folder is absent on a fresh clone and in CI, so six
 * of the twelve refuse there on every run. Counting those as unmeasured pins
 * the verdict at `incomplete` forever, and a signal that never changes is one
 * nobody reads after the second time they see it.
 *
 * A tracked corpus gets no such allowance. That tree ships to targets, so a
 * checkout that cannot find it is broken, and reading the absence as ordinary
 * would report a pass over a corpus nobody measured.
 */
function isExpectedAbsence(spec: AuditSpec, record: unknown): boolean {
  if (spec.corpus !== 'per-machine') return false

  const reason = asObject(record)?.reason
  return (
    typeof reason === 'string' &&
    (ABSENT_REASONS as readonly string[]).includes(reason)
  )
}

/**
 * Turns one verb's exit code and stdout into a result the aggregate can report.
 *
 * Unparseable output is `unmeasured` rather than clean, for the reason the
 * verify pipeline already states about its own skipped stages: a run that does
 * not report is a broken command, and skipping would report the pass the check
 * exists to withhold.
 */
export function classify(
  spec: AuditSpec,
  exitCode: number,
  stdout: string,
): AuditResult {
  const base = {
    id: spec.id,
    label: spec.label,
    tracked: isTracked(spec),
    exitCode,
  }

  let record: unknown
  let parsed = true
  try {
    record = JSON.parse(stdout)
  } catch {
    parsed = false
  }

  if (exitCode === EXIT_REFUSED) {
    return {
      ...base,
      status: isExpectedAbsence(spec, record) ? 'absent' : 'unmeasured',
      reason: parsed
        ? refusalReason(record, exitCode)
        : `refused with no record on stdout`,
    }
  }

  const counts = parsed ? spec.counts(record) : undefined

  if (spec.gatingExits.includes(exitCode)) {
    return { ...base, status: 'finding', ...(counts && { counts }) }
  }

  if (exitCode !== 0 && exitCode !== EXIT_FINDINGS) {
    return {
      ...base,
      status: 'unmeasured',
      reason: `exited ${exitCode}, which this verb does not document`,
    }
  }

  if (counts === undefined) {
    return {
      ...base,
      status: 'unmeasured',
      reason: parsed
        ? 'the record did not carry the keys this audit reads'
        : 'stdout carried no JSON record',
    }
  }

  if (exitCode === EXIT_FINDINGS) {
    return { ...base, status: 'reported', counts }
  }

  const quiet = Object.values(counts).every((value) => value === 0)
  return { ...base, status: quiet ? 'clean' : 'reported', counts }
}
