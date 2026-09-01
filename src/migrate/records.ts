/**
 * The move of the gitignored session records from `.claude/` to `.canon/`.
 *
 * Two halves that share one list. The folders themselves are untracked, so
 * relocating them is a filesystem act no commit records, while every tracked
 * file naming one of their paths is a citation that goes stale the moment they
 * land. Running one half without the other leaves a tree whose records are at a
 * root nothing points at, which is why the same verb performs both.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  type RecordRoot,
  RECORD_ENTRIES,
  RECORD_ROOTS,
  spell,
} from '@/record-root'

/** The root the entries below leave, exported so the writer can prune it. */
export const FROM_ROOT: RecordRoot = '.claude'

/** The root they arrive at. */
const TO_ROOT: RecordRoot = '.canon'

/**
 * Every entry the move relocates, at the name `.claude/` gave it.
 *
 * The list is `RECORD_ENTRIES`, which `record-root.ts` owns because a seed
 * destination and a superseded-layout report ask the same question. Restating
 * it here would let the sweep and the resolver disagree about what moved.
 */
export const MOVED_ENTRIES = RECORD_ENTRIES

/** Where an entry sits before the move, relative to the project root. */
export function sourcePath(entry: string): string {
  return join(FROM_ROOT, entry)
}

/** Where it sits after, which is the only place the scratch folder is renamed. */
export function destinationPath(entry: string): string {
  return join(TO_ROOT, spell(TO_ROOT, entry))
}

/**
 * A citation into a moved entry.
 *
 * The tail rejects a following name character rather than asking for a word
 * boundary, and that is what protects the three retired flat archives without
 * an exception list: `.claude/plans-archive` continues into a `-` and never
 * matches, where `.claude/plans/` and a bare `.claude/plans` both do. A
 * boundary would treat the hyphen as a break and rewrite the archive to a root
 * it never sat under.
 *
 * The alternation is ordered longest first so `README.md` is decided before any
 * shorter entry can claim its prefix, and each entry is escaped because two of
 * them carry a dot.
 */
const CITATION = new RegExp(
  `${escape(FROM_ROOT)}/(${[...MOVED_ENTRIES]
    .sort((left, right) => right.length - left.length)
    .map(escape)
    .join('|')})(?![A-Za-z0-9._-])`,
  'g',
)

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Files whose content is left alone entirely.
 *
 * The changelog is release history, whose entries record what shipped while the
 * records were still under the old root. An eval result is a transcript of the
 * paths a session actually opened. Rewriting either makes it testify to
 * something that never happened.
 *
 * This module and `src/record-root.ts` are the two sources that state the old
 * root on purpose. Sweeping them turns every citation this expression is built
 * from into its own replacement, leaving a rewriter that maps `.canon/` to
 * `.canon/` and matches nothing.
 *
 * A test file is excluded because the fixtures that prove the old root still
 * resolves have to keep building it. Rewriting one is worse than a failing
 * test: the old-root case collapses into a copy of the new-root case beside it
 * and keeps passing, reporting coverage for a fallback nothing exercises.
 *
 * A hook is the third source that states both roots on purpose. Each one guards
 * on a `case` carrying an arm per root, so rewriting the old arm collapses the
 * pair into two copies of the new one and shellcheck reports a pattern that can
 * never match. The guard then stops firing in a project the move has not
 * reached, which is silent: the index goes stale while every save succeeds.
 */
const EXCLUDED_PREFIXES: readonly string[] = [
  'src/migrate/',
  'scripts/eval/result-',
  '.claude/hooks/',
  'tooling/claude/seeds/.claude/hooks/',
]

const EXCLUDED_PATHS: readonly string[] = ['CHANGELOG.md', 'src/record-root.ts']

const EXCLUDED_SUFFIXES: readonly string[] = ['.test.ts']

export function isExcludedPath(path: string): boolean {
  if (EXCLUDED_PATHS.includes(path)) return true
  if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return true
  return EXCLUDED_SUFFIXES.some((suffix) => path.endsWith(suffix))
}

/**
 * The roots holding nothing but records, so a path under one is a record
 * whatever it is named.
 *
 * `.canon/` qualifies by construction. `.claude/ARCHITECTURE.md` fixes the rule
 * that every gitignored session record moves there and nothing tracked ever
 * lands there, which covers a record folder `RECORD_ENTRIES` has yet to learn
 * about. The old root is the one that cannot take a whole-root reading, and it
 * is derived by exclusion rather than named, so a third root added later reads
 * as records-only unless someone says otherwise.
 *
 * Exported because `record-tree.ts` sweeps inside these roots and has to name
 * them rather than invert `isRecordArtifact`. That predicate is true for the old
 * root's record entries as well, so an inversion would sweep a project the move
 * has not run in, where the old spelling is the correct one.
 */
export const RECORD_ONLY_ROOTS: readonly RecordRoot[] = RECORD_ROOTS.filter(
  (root) => root !== FROM_ROOT,
)

/**
 * Every prefix under which a path is a record rather than a file to sweep.
 *
 * The asymmetry is the point. A whole-root prefix is correct for the new root
 * and wrong for the old one, which is mixed: this repository tracks 163 files
 * under `.claude/`, and a target's installed `.claude/rules/core/035-tasks.md`
 * is the file the sweep exists to repoint, so a bare `.claude/` prefix strands
 * it silently. The old root is therefore entry-scoped, through `spell` so the
 * one naming variant stays decided in `record-root.ts`.
 *
 * Joined with a literal separator rather than through `join`, the way
 * `EXCLUDED_PREFIXES` already is. These are matched against what `git ls-files`
 * returns, which is forward-slashed on every platform, where `join` would spell
 * a backslash on Windows and match nothing.
 */
const RECORD_PREFIXES: readonly string[] = [
  ...RECORD_ONLY_ROOTS,
  ...RECORD_ENTRIES.map((entry) => `${FROM_ROOT}/${spell(FROM_ROOT, entry)}`),
]

/**
 * Whether a path is a record artifact, which the sweep passes over entirely.
 *
 * Separate from `isExcludedPath`, which reports what it skips because a reader
 * has to check those by hand. A record artifact is never something to check,
 * and a target's record tree is large enough that reporting each one would bury
 * the handful of exclusions that matter.
 *
 * A record folder becomes visible to the sweep at the moment `canon tooling
 * sync claude` prunes the twelve old ignore entries down to one `.canon/` line,
 * which is the step the documented first-run order puts immediately before this
 * verb. Without this predicate the run that follows reads the memory pen and
 * the groundwork trails as source and rewrites them.
 *
 * The three retired flat archives stay outside this, the way `CITATION` already
 * leaves them alone: `.claude/plans-archive/x.md` does not start with
 * `.claude/plans/`, and widening the entry list to catch it would change what
 * `MOVED_ENTRIES` means for the folder half of the verb.
 */
export function isRecordArtifact(path: string): boolean {
  return RECORD_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Marks a line naming the old root on purpose.
 *
 * Prose that dates a decision, records where a defect landed, or names the
 * fallback a target still resolves through all have to keep saying `.claude/`,
 * and a sweep cannot tell those from a live path. The marker sits on the line
 * itself or on the one above it, which is the placement `canon-keep-retired`
 * and `canon-allow-superseded` already use here.
 */
const KEEP_MARKER = 'canon-keep-record-root'

function isKept(lines: readonly string[], index: number): boolean {
  if (lines[index]?.includes(KEEP_MARKER)) return true
  return index > 0 && (lines[index - 1]?.includes(KEEP_MARKER) ?? false)
}

/** Rewrites every unmarked citation into a moved entry. */
export function rewriteText(text: string): string {
  const lines = text.split('\n')

  return lines
    .map((line, index) =>
      isKept(lines, index)
        ? line
        : line.replace(CITATION, (_match, entry: string) =>
            destinationPath(entry),
          ),
    )
    .join('\n')
}

/**
 * How many citations `rewriteText` would rewrite, and how many marked lines it
 * left alone. The second number is what says the markers fired at all, which a
 * diff cannot show because a protected line does not appear in one.
 */
export function scanText(text: string): {
  readonly rewritten: number
  readonly kept: number
} {
  const lines = text.split('\n')
  let rewritten = 0
  let kept = 0

  for (const [index, line] of lines.entries()) {
    const matches = [...line.matchAll(CITATION)].length
    if (matches === 0) continue

    if (isKept(lines, index)) kept += matches
    else rewritten += matches
  }

  return { rewritten, kept }
}

export interface FolderMove {
  readonly from: string
  readonly to: string
}

/**
 * The entries actually on disk under the old root, with where each lands.
 *
 * An entry already present at the destination is reported as a collision by the
 * caller rather than filtered out here, since merging two record folders is a
 * judgment no verb should take on a memory pen.
 */
export function planFolderMoves(root: string): FolderMove[] {
  return MOVED_ENTRIES.filter((entry) =>
    existsSync(join(root, sourcePath(entry))),
  ).map((entry) => ({ from: sourcePath(entry), to: destinationPath(entry) }))
}

/** Moves whose destination is already taken, which the verb refuses on. */
export function collisions(
  root: string,
  moves: readonly FolderMove[],
): string[] {
  return moves
    .filter((move) => existsSync(join(root, move.to)))
    .map((move) => move.to)
}

/**
 * Whether a project's ignore rules already cover the new root.
 *
 * The gate exists because every entry being moved is ignored where it stands.
 * Landing them under a root the project does not ignore publishes the memory
 * pen and the groundwork trails into the next commit, which is the same harm
 * the records remote gate refuses for the same payload. Reading the file rather
 * than asking git keeps the answer available in a project with no commits yet.
 */
export function ignoresDestination(gitignore: string): boolean {
  return gitignore
    .split('\n')
    .map((line) => line.trim())
    .some((line) => line === TO_ROOT || line === `${TO_ROOT}/`)
}

/** One tracked file, as the planner reads it. */
export interface RecordsSource {
  readonly path: string
  readonly text: string
}

/** One file whose citations move, carried with the text to write back. */
export interface CitationEntry {
  readonly path: string
  readonly text: string
  readonly rewritten: number
  readonly kept: number
}

export interface RecordsPlan {
  readonly moves: readonly FolderMove[]
  readonly collisions: readonly string[]
  readonly entries: readonly CitationEntry[]
  readonly excluded: readonly string[]
  readonly rewritten: number
  readonly kept: number
}

/**
 * What the move would do, without doing it.
 *
 * The folder half reads disk and the citation half is pure over the sources it
 * is handed, so a caller can report the whole plan and apply it from the same
 * value. A file whose text does not change is dropped rather than carried as a
 * no-op, which keeps the reported file count equal to what the sweep writes.
 */
export function planRecordsMove(
  root: string,
  sources: readonly RecordsSource[],
): RecordsPlan {
  const moves = planFolderMoves(root)
  const entries: CitationEntry[] = []
  const excluded: string[] = []
  let kept = 0

  for (const source of sources) {
    // Silently, and ahead of the exclusion test. The command boundary filters
    // these out before it reads them, so this is what keeps the pure function
    // correct under a direct call rather than what the verb relies on.
    if (isRecordArtifact(source.path)) continue

    if (isExcludedPath(source.path)) {
      // Only an excluded file that actually carries a citation is reported. The
      // predicate covers every test file in the tree, so counting them all would
      // report hundreds of exclusions the sweep was never going to touch and
      // bury the handful a reader has to go and check by hand.
      if (scanText(source.text).rewritten > 0) excluded.push(source.path)
      continue
    }

    const counts = scanText(source.text)
    kept += counts.kept
    if (counts.rewritten === 0) continue

    entries.push({
      path: source.path,
      text: rewriteText(source.text),
      rewritten: counts.rewritten,
      kept: counts.kept,
    })
  }

  return {
    moves,
    collisions: collisions(root, moves),
    entries,
    excluded,
    rewritten: entries.reduce((sum, entry) => sum + entry.rewritten, 0),
    kept,
  }
}
