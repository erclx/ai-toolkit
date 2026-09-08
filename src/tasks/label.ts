import { existsSync } from 'node:fs'
import { relative } from 'node:path'
import {
  archiveDir,
  declinedDir,
  listTaskStems,
  tasksDir,
} from '@/tasks/archive'

/** Every label in the corpus today stops here before rolling to the next major. */
const MINOR_ROLLOVER = 9

/** The label a board with no live or archived task yet allocates first. */
const FIRST_LABEL: Label = { major: 1, minor: 0 }

/**
 * Matches a task filename stem's leading label. Anchored, so a sibling such as
 * `TASK-ARCHIVE` fails it outright, and a reserved stem such as `index` or
 * `priority` never reaches it at all, since `listTaskStems` already filters
 * those out before this pattern sees a stem.
 */
export const LABEL_PATTERN = /^v(\d+)\.(\d+)-/

interface Label {
  readonly major: number
  readonly minor: number
}

export interface NextLabel {
  readonly ok: true
  readonly label: string
  /** The label this run was derived from, absent when neither folder holds one. */
  readonly highest: string | undefined
}

export interface LabelRefused {
  readonly ok: false
  readonly reason: 'no-board'
  readonly message: string
}

export type LabelOutcome = NextLabel | LabelRefused

function parseLabel(stem: string): Label | undefined {
  const match = LABEL_PATTERN.exec(stem)
  if (!match) return undefined

  return { major: Number(match[1]), minor: Number(match[2]) }
}

function isHigher(candidate: Label, current: Label): boolean {
  return candidate.major !== current.major
    ? candidate.major > current.major
    : candidate.minor > current.minor
}

function formatLabel(label: Label): string {
  return `v${String(label.major).padStart(2, '0')}.${label.minor}`
}

/**
 * The label after the one given, rolling a minor of 9 to the next major rather
 * than continuing to a second minor digit. Every one of the 587 labels measured
 * across the live board and its archive on 2026-09-06 stops at a single digit,
 * so this is the rollover the whole corpus already follows rather than a rule
 * this verb introduces.
 */
function next(label: Label): Label {
  return label.minor >= MINOR_ROLLOVER
    ? { major: label.major + 1, minor: 0 }
    : { major: label.major, minor: label.minor + 1 }
}

/**
 * Reports the next unused phase label, read off the true maximum across
 * `.canon/tasks/` and its `archive/` and `declined/` siblings together. A scan
 * confined to the live board is blind to every label a settled folder already
 * spent, which is what let two sessions hand out the same label within
 * minutes of each other.
 *
 * It reports and never writes. Two sessions calling it in the same second can
 * still take the same answer, since the board is gitignored files rather than
 * a store with a lock, and `standards/versioning.md` permits free renumbering,
 * so a collision costs a rename rather than anything worse. A duplicate label
 * already sitting in the tree, and a gap left by a renumbering, both fold into
 * the same max scan without needing a dedicated check.
 */
export async function nextLabel(root: string): Promise<LabelOutcome> {
  const dir = tasksDir(root)

  if (!existsSync(dir)) {
    return {
      ok: false,
      reason: 'no-board',
      message: `No task board at ${relative(root, dir)}.`,
    }
  }

  const settled = [archiveDir(root), declinedDir(root)].filter((candidate) =>
    existsSync(candidate),
  )
  const dirs = [dir, ...settled]
  const stems = (await Promise.all(dirs.map((d) => listTaskStems(d)))).flat()

  const highest = stems
    .map(parseLabel)
    .filter((label): label is Label => label !== undefined)
    .reduce<Label | undefined>(
      (max, label) => (max === undefined || isHigher(label, max) ? label : max),
      undefined,
    )

  return {
    ok: true,
    label: formatLabel(highest === undefined ? FIRST_LABEL : next(highest)),
    highest: highest === undefined ? undefined : formatLabel(highest),
  }
}
