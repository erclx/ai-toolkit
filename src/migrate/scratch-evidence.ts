/**
 * The promotion of nine cited measurement folders out of `.canon/tmp/` into
 * `.canon/review/evidence/`, which `canon records push` already backs.
 *
 * The scratch root is the one record root a disk loss takes with it, and a
 * durable record naming a folder under it as its evidence is a citation into
 * something the backup never covers. The nine promoted here are every folder
 * under scratch that a live or archived record cites and no source file under
 * `claude/`, `scripts/`, `src/`, `governance/`, or `standards/` names by path,
 * which is what separates them from a folder a script still writes into on its
 * own schedule.
 *
 * Distinct from `record-tree.ts`, which repoints a citation of the `.claude/`
 * to `.canon/` root move and prunes every `archive` segment on the way in,
 * since an archived record describes work that already closed. This move
 * reaches into an archive on purpose: `tasks/archive/`, `plans/archive/`, and
 * `groundwork/` are where most of the citations broken here already sit, and
 * a folder promoted out from under them stays gone whether the citing record
 * is open or closed.
 *
 * Honors the same `canon-keep-record-root` marker `records.ts` reads, since a
 * sentence describing what no target holds is not a live pointer this checkout
 * has to keep resolving.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { BACKED_FOLDERS } from '@/records/backup'
import { recordDir, SCRATCH } from '@/record-root'

/**
 * Every folder this promotion moves, at the name it carries under scratch.
 *
 * Derived by the two-clause test `canon migrate scratch-evidence` exists to
 * apply mechanically: a durable record under a `BACKED_FOLDERS` entry, live
 * or archived, names the folder as its evidence, and no file under `claude/`,
 * `scripts/`, `src/`, `governance/`, or `standards/` names that path. Measured
 * 2026-09-06 against nine folders holding thirteen files.
 *
 * `verify-astro` and `verify-vite-react` pass the same test and are excluded
 * by name: both are scaffolds a command generates rather than records a
 * session wrote, and each is 100+ MB, which the review remote is not sized
 * for. `ablation`, `eval-runs`, `sandbox-runs`, `memory-archive`,
 * `groundwork-fixtures`, `precompact-handoff`, `pr-poll`, `pr`,
 * `address-review`, and `memory-routing` fail the second clause: a script or
 * a skill body names each of those paths, so moving one needs a code change
 * first rather than a promotion.
 */
export const PROMOTED_FOLDERS: readonly string[] = [
  'hero-probe',
  'markdown-corpus-sweep',
  'orchestrator-output',
  'orchestrator-watch',
  'review-calibration',
  'sandbox-drift',
  'skill-requirement-pass',
  'system-map',
  'target-survey',
]

const EVIDENCE_ROOT = ['review', 'evidence'] as const

/** Where a promoted folder sits before the move. */
export function sourcePath(root: string, folder: string): string {
  return recordDir(root, SCRATCH, folder)
}

/** Where it lands after, always under whichever root `review/` resolves at. */
export function destinationPath(root: string, folder: string): string {
  return recordDir(root, ...EVIDENCE_ROOT, folder)
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The prefixes a citation of a promoted folder is spelled with, absolute at
 * either record root and relative from one directory below it. A tail
 * rejecting a following name character is what keeps `target-survey` from
 * swallowing a sibling folder whose name extends it.
 */
const OLD_PREFIXES = [
  '.claude/.tmp/',
  '.canon/tmp/',
  '../.tmp/',
  '../tmp/',
  '../../.tmp/',
  '../../tmp/',
] as const

function citationPattern(folder: string): RegExp {
  const alternation = OLD_PREFIXES.map(escape).join('|')
  return new RegExp(
    `(?:${alternation})${escape(folder)}(?![A-Za-z0-9._-])`,
    'g',
  )
}

/** One promoted folder's citation pattern, paired with its replacement. */
const REWRITES: readonly {
  readonly pattern: RegExp
  readonly folder: string
}[] = PROMOTED_FOLDERS.map((folder) => ({
  pattern: citationPattern(folder),
  folder,
}))

/**
 * Marks a line naming a promoted folder's old path on purpose, the same
 * marker `records.ts` reads: on the line itself or on the nearest non-blank
 * line above it. A sentence describing what no target holds, rather than
 * pointing a reader at this checkout's own evidence, needs the old spelling
 * kept, and a mechanical rewrite cannot tell that apart from a live citation.
 */
const KEEP_MARKER = 'canon-keep-record-root'

function isKept(lines: readonly string[], index: number): boolean {
  if (lines[index]?.includes(KEEP_MARKER)) return true

  let above = index - 1
  while (above >= 0 && lines[above]?.trim() === '') above -= 1

  return above >= 0 && (lines[above]?.includes(KEEP_MARKER) ?? false)
}

function rewriteLine(line: string): string {
  return REWRITES.reduce(
    (current, { pattern, folder }) =>
      current.replace(pattern, `.canon/review/evidence/${folder}`),
    line,
  )
}

/**
 * Rewrites every unmarked citation of a promoted folder into its destination
 * under `.canon/review/evidence/`, absolute regardless of how the source
 * citation was spelled. A file naming no promoted folder returns
 * byte-identical, and a marked line is returned unchanged.
 */
export function rewriteScratchEvidence(text: string): string {
  const lines = text.split('\n')
  return lines
    .map((line, index) => (isKept(lines, index) ? line : rewriteLine(line)))
    .join('\n')
}

/** How many unmarked citations `rewriteScratchEvidence` would change. */
export function countScratchEvidenceCitations(text: string): number {
  const lines = text.split('\n')
  let count = 0

  for (const [index, line] of lines.entries()) {
    if (isKept(lines, index)) continue
    for (const { pattern } of REWRITES) {
      count += [...line.matchAll(pattern)].length
    }
  }

  return count
}

/** The files under every `BACKED_FOLDERS` entry, archives included. */
export async function walkScratchEvidenceCorpus(
  root: string,
): Promise<string[]> {
  const files: string[] = []

  for (const folder of BACKED_FOLDERS) {
    const dir = recordDir(root, folder)
    if (!existsSync(dir)) continue

    const glob = new Bun.Glob('**/*')
    for await (const path of glob.scan({
      cwd: dir,
      onlyFiles: true,
      dot: true,
    })) {
      files.push(join(dir, path))
    }
  }

  return files.sort()
}

export interface ScratchEvidenceSource {
  readonly path: string
  readonly text: string
}

/** Reads every file the walk found, skipping one that carries a NUL byte. */
export async function readScratchEvidenceCorpus(
  paths: readonly string[],
): Promise<ScratchEvidenceSource[]> {
  const sources: ScratchEvidenceSource[] = []

  for (const path of paths) {
    const bytes = await readFile(path).catch(() => undefined)
    if (bytes === undefined || bytes.includes(0)) continue

    sources.push({ path, text: bytes.toString('utf8') })
  }

  return sources
}

export interface FolderMove {
  readonly folder: string
  readonly from: string
  readonly to: string
}

export interface CitationEntry {
  readonly path: string
  readonly text: string
  readonly rewritten: number
}

export interface ScratchEvidencePlan {
  readonly moves: readonly FolderMove[]
  readonly collisions: readonly string[]
  readonly entries: readonly CitationEntry[]
  readonly rewritten: number
}

/**
 * Every promoted folder found on disk, with its destination, refusing a
 * folder whose destination is already occupied rather than merging into it.
 */
export function planFolderMoves(root: string): {
  moves: FolderMove[]
  collisions: string[]
} {
  const moves: FolderMove[] = []
  const collisions: string[] = []

  for (const folder of PROMOTED_FOLDERS) {
    const from = sourcePath(root, folder)
    if (!existsSync(from)) continue

    const to = destinationPath(root, folder)
    if (existsSync(to)) {
      collisions.push(to)
      continue
    }

    moves.push({ folder, from, to })
  }

  return { moves, collisions }
}

/**
 * What the promotion would do, without doing it. Pure over the sources it is
 * handed, the way `planRecordTree` is, so a caller reports and applies from
 * the same value. A file whose text does not change is dropped.
 */
export function planScratchEvidence(
  root: string,
  sources: readonly ScratchEvidenceSource[],
): ScratchEvidencePlan {
  const { moves, collisions } = planFolderMoves(root)
  const entries: CitationEntry[] = []

  for (const source of sources) {
    const rewritten = countScratchEvidenceCitations(source.text)
    if (rewritten === 0) continue

    entries.push({
      path: source.path,
      text: rewriteScratchEvidence(source.text),
      rewritten,
    })
  }

  return {
    moves,
    collisions,
    entries,
    rewritten: entries.reduce((sum, entry) => sum + entry.rewritten, 0),
  }
}

export interface ScratchEvidenceResult {
  readonly moved: number
  readonly written: number
  readonly failed: readonly string[]
}

/** Writes the plan: every folder move, then every citation rewrite. */
export async function applyScratchEvidence(
  plan: ScratchEvidencePlan,
): Promise<ScratchEvidenceResult> {
  let moved = 0
  let written = 0
  const failed: string[] = []

  for (const move of plan.moves) {
    await mkdir(dirname(move.to), { recursive: true })
    const done = await rename(move.from, move.to)
      .then(() => true)
      .catch(() => false)

    if (done) moved += 1
    else failed.push(move.from)
  }

  for (const entry of plan.entries) {
    const done = await writeFile(entry.path, entry.text)
      .then(() => true)
      .catch(() => false)

    if (done) written += 1
    else failed.push(entry.path)
  }

  return { moved, written, failed }
}
