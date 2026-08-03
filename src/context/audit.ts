import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import type { AuditedFolder } from '@/context/folders'

/** Checkpoints quoted from `standards/context.md`. Neither is a cap. */
export const LENGTH_CHECKPOINT = 150
export const RUN_CHECKPOINT = 40

/**
 * Columns a source line wraps at when rendered.
 *
 * Nothing in this repository sets a line width and entries are authored one
 * line per bullet, so the rendered width is the viewer's rather than the file's.
 * The common terminal and diff width is the reproducible choice, and the report
 * legend states it so a reader can arrive at the same number by hand.
 */
export const RENDER_WIDTH = 80

/**
 * Characters a bullet averages before its list stops reading as a set of peers.
 *
 * The exemption below covers a flat catalog of one-liners and a stack of
 * paragraphs equally, and only the first is navigable. Measured across this
 * corpus the two shapes separate with nothing between roughly 100 and 170
 * characters a bullet, so the midpoint splits the population rather than a
 * continuum. It is a checkpoint like the two above, not a cap.
 */
export const PEER_BULLET_CHECKPOINT = 130

/**
 * Characters a bullet carries before it holds more than the decision itself.
 *
 * Unlike the peer-list checkpoint above, this corpus has no gap behind the
 * number. Bullet weight decays smoothly from a median near 170 with the
 * steepest relative fall across this boundary and nothing resembling two
 * populations, so the number is a judgment where that one was a measurement.
 * A bullet that reads well past it means the number is wrong rather than the
 * rule, which is why this reports and never gates.
 */
export const BULLET_CHECKPOINT = 400

/**
 * A table this size or larger whose first column mostly names artifacts reads
 * as a catalog that grows a row per shipped thing, which is the shape the
 * standard routes to a bullet list. Below it, a table is small enough that a
 * reflow rewrites little.
 */
export const CATALOG_ROW_CHECKPOINT = 6

/** Share of first cells that must name an artifact for a table to qualify. */
const CATALOG_NAMED_RATIO = 0.6

/**
 * Sections `standards/context.md` marks required, in the order it states them.
 *
 * The list is held here rather than read out of the standard, the way the four
 * checkpoints above quote their numbers. A parser over the standard's prose
 * would decide which sections are required from the wording around them, so it
 * fails on a rewrite of that wording rather than on a defect in an entry.
 *
 * These names do not generalize the way a length threshold does, which is why
 * the measure is scoped to the folder `governsContent` names. A diagram entry
 * declares a heading per kind and a wireframe entry per screen, and neither
 * sibling standard states a required section at all.
 */
export const REQUIRED_SECTIONS: readonly string[] = ['Overview', 'Layout']

const FRONTMATTER = /^---\n[\s\S]*?\n---\n?/
const FENCE = /^\s*(```|~~~)/
const HEADING = /^#{1,6}\s/
const HEADING_TEXT = /^#{1,6}\s+(.+?)\s*$/
const LIST_ITEM = /^(\s*)([-*+]|\d+\.)\s+/
const TABLE_ROW = /^\s*\|/
const TABLE_SEPARATOR = /^\s*\|[\s:|-]+\|\s*$/
const NAMED_CELL = /`[^`]+`|\[[^\]]+\]\([^)]+\)/

/**
 * Spellings of how the domain reached its shape rather than what it is now.
 *
 * The standard admits a rejected alternative and its reasoning while refusing
 * the provenance attached to it, and these three are what a session reaches for
 * when it records the second: when a change landed, which change carried it,
 * and which release labelled it. A marker is a judgment rather than a defect,
 * so this is measured and reported and never gates.
 */
const PROVENANCE: readonly { kind: ProvenanceKind; pattern: RegExp }[] = [
  { kind: 'date', pattern: /\b\d{4}-\d{2}-\d{2}\b/g },
  { kind: 'change', pattern: /#\d{3,}\b/g },
  { kind: 'release', pattern: /\bv\d+\.\d+(?:\.\d+)?\b/g },
]

/**
 * The folder whose standard carries the exclusion above.
 *
 * `standards/context.md` opens its scope by handing diagrams and wireframes to
 * `diagrams.md` and `wireframes.md`, so a marker reported in either would cite
 * a rule that entry's own standard routes elsewhere. The length, depth, and
 * table checkpoints are quoted from the same standard and keep reaching every
 * audited folder, because a threshold on how far a reader travels generalizes
 * across entry types while a rule about what an entry may say does not.
 *
 * Bullet weight sits on this side of the split with provenance, which the
 * measure alone would not predict. What decides it is whether the remedy is
 * actionable: subdividing a run and splitting a file mean something in any
 * entry, while moving an incident out of a bullet and keeping the decision
 * means nothing in a folder whose entries carry no decisions to keep. No
 * diagram entry declares `## Decisions` or `## Gotchas`, so the scope of the
 * rule is what narrows the finding rather than the shape of the number.
 *
 * Restating the exclusion in the sibling standards was the alternative. It
 * duplicates one knowledge item across three surfaces, which the root
 * instruction file forbids, and pointing is not available because the surface
 * they would point at is the one disclaiming them. Should a diagram entry ever
 * accumulate narration, the escalation is an attribute standard owning the rule
 * across document types, not restoring this reach without an owner.
 */
export const PROVENANCE_FOLDER = 'context'

export type ProvenanceKind = 'date' | 'change' | 'release'

export interface TableFinding {
  readonly line: number
  readonly rows: number
}

export interface BulletFinding {
  readonly line: number
  /** Weight as folded, so a report says how far past the checkpoint it sits. */
  readonly characters: number
}

export interface ProvenanceFinding {
  readonly line: number
  readonly kind: ProvenanceKind
  /** The marker as written, so a report names what to go and look at. */
  readonly text: string
}

export interface EntryReport {
  readonly rel: string
  /**
   * Rendered lines across the whole file, counting frontmatter and fenced
   * blocks. Both this and `longestRun` measure in the same unit, since the two
   * checkpoints they feed sit in one section of the standard and a reader
   * compares them.
   *
   * The exclusions differ on purpose. `longestRun` skips a fence so an example
   * cannot break the run around it, and a file measure has no run to protect.
   * Excluding fences here would change which entries report by one and would
   * not reach the case that motivates it: the most fenced entry in the corpus
   * runs 20 percent fenced and sits past the checkpoint either way.
   */
  readonly lines: number
  /** Rendered lines at `RENDER_WIDTH`, not source lines. */
  readonly longestRun: number
  /** First line of the longest run, or 0 when the entry has no run at all. */
  readonly longestRunLine: number
  readonly catalogTables: readonly TableFinding[]
  /** Empty for an entry no standard bans a change narrative in. */
  readonly provenance: readonly ProvenanceFinding[]
  /** Empty for the same reason `provenance` is, and under the same folder. */
  readonly heavyBullets: readonly BulletFinding[]
  /**
   * Required sections this entry declares, in the standard's order, and empty
   * outside the folder whose standard names them. What the folder is short of
   * is `missingSections`, since one entry answers for its siblings.
   */
  readonly sections: readonly string[]
}

export interface SectionFinding {
  /**
   * Repo-relative path of whatever owes the sections: the entry itself in the
   * folder named under `.claude/`, and the folder in a domain split across
   * one, since the split folder's entries answer for each other.
   */
  readonly rel: string
  /** Required sections the path above does not declare, never empty. */
  readonly missing: readonly string[]
}

interface BodyLine {
  readonly number: number
  readonly text: string
}

/**
 * Drops the frontmatter while keeping every surviving line's original number,
 * so a finding points at the line an editor opens rather than at an offset into
 * the body.
 */
function bodyLines(source: string): BodyLine[] {
  const match = source.match(FRONTMATTER)
  const offset = match ? match[0].split('\n').length - 1 : 0

  return source
    .slice(match ? match[0].length : 0)
    .replace(/\n$/, '')
    .split('\n')
    .map((text, index) => ({ number: offset + index + 1, text }))
}

/**
 * Reports whether a run is the peer list the standard exempts.
 *
 * Every non-blank line has to be a list item at one indent. Prose mixed into
 * the run or a nested level inside it ends the exemption, because either one
 * means the block is no longer a flat set a reader can skim. Bullet count says
 * nothing on its own, since a catalog of one-liners and a wall of paragraphs
 * reach the same count and read nothing alike, so the average bullet is what
 * decides whether the set is still skimmable.
 */
function isScannablePeerList(run: readonly BodyLine[]): boolean {
  const indents = new Set<number>()
  let items = 0
  let characters = 0

  for (const line of run) {
    const text = line.text.trim()
    if (text === '') continue

    const match = line.text.match(LIST_ITEM)
    if (!match) return false
    indents.add(match[1].length)
    items++
    characters += text.length
  }

  if (indents.size !== 1) return false

  return characters / items < PEER_BULLET_CHECKPOINT
}

/**
 * Reports whether a run is a table, the second shape the checkpoint cannot fix.
 *
 * The peer list above is exempt because it is already navigable. A table is
 * exempt for the other reason: the remedy does not exist. A heading dropped
 * inside one splits the table into two tables rather than breaking the run, so
 * a catalog renders as an unbroken stretch by construction and no edit short of
 * rewriting it as a list clears the report.
 *
 * Every non-blank line has to be a row. A run holding a table between
 * paragraphs is genuinely mixed, and a heading breaks it at a seam either side,
 * so testing whether the run holds a table would hide the case the checkpoint
 * exists for.
 *
 * A delimiter is required rather than assumed, matching the table scan below. A
 * stack of lines opening with a pipe and no delimiter renders as paragraph text
 * and would otherwise earn the exemption on its punctuation.
 */
function isTableRun(run: readonly BodyLine[]): boolean {
  let separators = 0

  for (const line of run) {
    if (line.text.trim() === '') continue
    if (!TABLE_ROW.test(line.text)) return false
    if (TABLE_SEPARATOR.test(line.text)) separators++
  }

  return separators > 0
}

/**
 * Height a source line occupies once wrapped.
 *
 * A blank line renders as the gap it is rather than as nothing, which keeps it
 * the distance the source measure already counted it as.
 */
function renderedHeight(text: string): number {
  return Math.max(1, Math.ceil(text.length / RENDER_WIDTH))
}

/**
 * Measures the longest run of lines no heading breaks, in rendered lines.
 *
 * Fenced blocks are skipped rather than treated as breaks, per the standard:
 * they leave the count without ending the run, so prose either side of an
 * example still measures as the one stretch a reader scrolls through. Blank
 * lines do count, since the checkpoint is about how far a reader travels
 * between signposts and a blank line is distance like any other. A hand reader
 * measuring without them lands one or two lines lower, which the report legend
 * states.
 *
 * Height is what a reader travels, and source lines only stand in for it while
 * lines stay short. An entry authored one line per bullet puts a paragraph on
 * each, so a block of fifteen bullets measures as fifteen and renders past
 * sixty. Wrapping every line at a stated width is what closes that gap.
 */
function longestRun(lines: readonly BodyLine[]): {
  length: number
  line: number
} {
  let longest = 0
  let longestLine = 0
  let run: BodyLine[] = []
  let fenced = false

  const close = (): void => {
    // The reported line is the run's first non-blank one, since that is what an
    // editor should open. A run of nothing but blank lines is the gap between
    // two headings rather than a stretch a reader travels, so it never counts.
    const first = run.find((line) => line.text.trim() !== '')

    if (first && !isScannablePeerList(run) && !isTableRun(run)) {
      const height = run.reduce(
        (sum, line) => sum + renderedHeight(line.text),
        0,
      )

      if (height > longest) {
        longest = height
        longestLine = first.number
      }
    }
    run = []
  }

  for (const line of lines) {
    if (FENCE.test(line.text)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue

    if (HEADING.test(line.text)) {
      close()
      continue
    }

    run.push(line)
  }

  close()

  return { length: longest, line: longestLine }
}

function firstCell(row: string): string {
  return row.split('|').slice(1)[0] ?? ''
}

/**
 * Finds the tables whose rows name shipped artifacts.
 *
 * A bare table count reports mostly fixed comparison tables, where a reflow
 * costs nothing because no row is ever added. The reflow problem belongs to a
 * catalog that gains a row per artifact, and a first column carrying a path,
 * command, or link is what separates the two without reading the prose.
 */
function catalogTables(lines: readonly BodyLine[]): TableFinding[] {
  const findings: TableFinding[] = []
  let fenced = false
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (FENCE.test(line.text)) {
      fenced = !fenced
      index++
      continue
    }
    if (fenced || !TABLE_ROW.test(line.text)) {
      index++
      continue
    }

    const separator = lines[index + 1]
    if (!separator || !TABLE_SEPARATOR.test(separator.text)) {
      index++
      continue
    }

    const body: BodyLine[] = []
    let cursor = index + 2
    while (cursor < lines.length && TABLE_ROW.test(lines[cursor].text)) {
      body.push(lines[cursor])
      cursor++
    }

    const named = body.filter((row) => NAMED_CELL.test(firstCell(row.text)))
    if (
      body.length >= CATALOG_ROW_CHECKPOINT &&
      named.length / body.length >= CATALOG_NAMED_RATIO
    ) {
      findings.push({ line: line.number, rows: body.length })
    }

    index = cursor
  }

  return findings
}

/**
 * Finds the top-level bullets carrying more than a decision.
 *
 * A nested item is left out rather than folded into its parent, since the
 * checkpoint asks what one bullet carries and a child carries its own. Lines
 * continuing a bullet do fold in, so a heavy bullet cannot fall under the
 * checkpoint by being wrapped across two source lines. Fenced blocks are
 * skipped for the reason the scans above skip them: a sample an entry displays
 * is not a claim it makes.
 */
function heavyBullets(lines: readonly BodyLine[]): BulletFinding[] {
  const findings: BulletFinding[] = []
  let open: BulletFinding | null = null
  let fenced = false

  const close = (): void => {
    if (open && open.characters > BULLET_CHECKPOINT) findings.push(open)
    open = null
  }

  for (const line of lines) {
    if (FENCE.test(line.text)) {
      fenced = !fenced
      close()
      continue
    }
    if (fenced) continue

    const item = line.text.match(LIST_ITEM)
    const text = line.text.trim()

    if (item) {
      close()
      if (item[1].length === 0) {
        open = { line: line.number, characters: text.length }
      }
      continue
    }

    if (text === '' || HEADING.test(line.text) || TABLE_ROW.test(line.text)) {
      close()
      continue
    }

    // The joining space a wrapped line would have carried, so folding two
    // source lines measures what one unwrapped line would have.
    if (open) open = { ...open, characters: open.characters + text.length + 1 }
  }

  close()

  return findings
}

/**
 * Finds the markers narrating a change rather than describing the domain.
 *
 * Fenced blocks are skipped for the same reason the table scan skips them: a
 * sample command or a fixture inside an example is content the entry displays
 * rather than a claim it makes, and a version pinned in an install line is the
 * ordinary shape of one.
 */
function provenance(lines: readonly BodyLine[]): ProvenanceFinding[] {
  // Scanning one pattern at a time emits a line's markers grouped by kind, so
  // the column is carried out of the match and sorted on. Without it a line
  // holding a date and two change numbers reports them in an order the reader
  // cannot find by scanning left to right.
  const found: { finding: ProvenanceFinding; column: number }[] = []
  let fenced = false

  for (const line of lines) {
    if (FENCE.test(line.text)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue

    for (const { kind, pattern } of PROVENANCE) {
      for (const match of line.text.matchAll(pattern)) {
        found.push({
          finding: { line: line.number, kind, text: match[0] },
          column: match.index,
        })
      }
    }
  }

  return found
    .sort((a, b) => a.finding.line - b.finding.line || a.column - b.column)
    .map((each) => each.finding)
}

/**
 * Finds which required sections the entry declares.
 *
 * A heading at any level counts rather than the `##` the standard writes its
 * examples at. A domain that split into a folder puts its overview in a sibling
 * named for it, where the section is the `#` title and an `##` beneath it would
 * repeat the file's own name. All three split folders in this repository are
 * that shape, so matching `##` alone would report every one of them. Nothing is
 * titled for a required section without being about it, so the looser match
 * costs no precision.
 *
 * Fenced blocks are skipped for the reason the scans above skip them. A
 * standard quoted inside an example declares nothing about the entry quoting it.
 */
function declaredSections(lines: readonly BodyLine[]): string[] {
  const found = new Set<string>()
  let fenced = false

  for (const line of lines) {
    if (FENCE.test(line.text)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue

    const match = line.text.match(HEADING_TEXT)
    if (match && REQUIRED_SECTIONS.includes(match[1])) found.add(match[1])
  }

  return REQUIRED_SECTIONS.filter((section) => found.has(section))
}

/**
 * Measures one entry, scanning for provenance only when a standard claims it.
 *
 * The caller passes jurisdiction rather than deriving it from `rel`, because a
 * path prefix hardcodes what `--folder` exists to override and misses a domain
 * split into `context/<sub-area>/`.
 */
export function measureEntry(
  rel: string,
  source: string,
  governsContent = true,
): EntryReport {
  const lines = bodyLines(source)
  const run = longestRun(lines)

  return {
    rel,
    lines: source
      .replace(/\n$/, '')
      .split('\n')
      .reduce((sum, text) => sum + renderedHeight(text), 0),
    longestRun: run.length,
    longestRunLine: run.line,
    catalogTables: catalogTables(lines),
    provenance: governsContent ? provenance(lines) : [],
    heavyBullets: governsContent ? heavyBullets(lines) : [],
    sections: governsContent ? declaredSections(lines) : [],
  }
}

/**
 * Measures every entry in the audited folders. A generated `index.md` is not
 * among them, since its body is rewritten on every regen and no checkpoint
 * describes a catalog.
 *
 * Jurisdiction is applied here rather than at the report, so the JSON record
 * and the printed run agree on which entries a content rule reached.
 */
export async function measureFolders(
  root: string,
  folders: readonly AuditedFolder[],
): Promise<EntryReport[]> {
  const reports: EntryReport[] = []

  for (const folder of folders) {
    for (const path of folder.entries) {
      reports.push(
        measureEntry(
          relative(root, path),
          await readFile(path, 'utf8'),
          governsContent(folder),
        ),
      )
    }
  }

  return reports
}

/** Reports whether the folder's standard is the one carrying the exclusion. */
export function governsContent(folder: AuditedFolder): boolean {
  return folder.name === PROVENANCE_FOLDER
}

/**
 * Names what does not declare the sections the standard requires.
 *
 * Which unit answers depends on what the folder is. A split folder's entries
 * describe one domain between them and carry the overview and the layout in a
 * sibling named for them, so any one of them answers and a per-file rule there
 * would report every other child of all three shipped splits. The entries of
 * the folder named under `.claude/` are one domain each, so each answers for
 * itself. Rolling those up too was the first shape of this check, and it let a
 * single sibling stand in for thirteen domains it says nothing about.
 *
 * The judgment sits in the caller because the split case needs the folder's
 * other entries, which `measureFolders` holds and `measureEntry` does not. A
 * folder with no entries of its own is a split parent holding an index and
 * subfolders, and it has nothing to require a section of.
 *
 * The standard sanctions omitting `## Layout` from a domain owning no paths,
 * which no measure can tell from an entry that forgot it. An entry of that
 * shape therefore reports, which is a reason this is printed and never gated on.
 */
export function missingSections(
  root: string,
  folders: readonly AuditedFolder[],
  entries: readonly EntryReport[],
): SectionFinding[] {
  const byRel = new Map(entries.map((entry) => [entry.rel, entry]))
  const findings: SectionFinding[] = []

  const shortOf = (declared: readonly string[]): string[] =>
    REQUIRED_SECTIONS.filter((name) => !declared.includes(name))

  for (const folder of folders) {
    if (!governsContent(folder) || folder.entries.length === 0) continue

    const reports = folder.entries
      .map((path) => byRel.get(relative(root, path)))
      .filter((entry) => entry !== undefined)

    if (folder.nested) {
      const missing = shortOf(reports.flatMap((entry) => entry.sections))
      if (missing.length > 0) findings.push({ rel: folder.rel, missing })
      continue
    }

    for (const entry of reports) {
      const missing = shortOf(entry.sections)
      if (missing.length > 0) findings.push({ rel: entry.rel, missing })
    }
  }

  return findings
}
