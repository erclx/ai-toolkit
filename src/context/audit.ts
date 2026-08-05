import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import type { AuditedFolder } from '@/context/folders'
import { type BodyLine, bodyLines } from '@/markdown/scan'
import { renderedHeight } from '@/markdown/structure'
import { isStubSeed } from '@/seed-marker'

/**
 * Checkpoint quoted from the standard stating it. It is not a cap.
 *
 * Entry length rests on one entry per domain, which is a domain fact, so
 * `standards/context.md` keeps it. Depth and bullet weight read the same over
 * any markdown file, so they are stated at the attribute tier and measured by
 * `aitk markdown audit` rather than here.
 */
export const LENGTH_CHECKPOINT = 150

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

const HEADING_TEXT = /^#{1,6}\s+(.+?)\s*$/
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
 * a rule that entry's own standard routes elsewhere. The length and table
 * checkpoints are quoted from the same standard and keep reaching every audited
 * folder, because a threshold on how far a reader travels generalizes across
 * entry types while a rule about what an entry may say does not.
 *
 * What gates here is a rule only this standard states. Bullet weight does not,
 * since `standards/markdown.md` owns that checkpoint across document types and
 * its remedy sends the overflow to prose, which any entry type can act on.
 * `standards/context.md` specializes that remedy for an entry carrying
 * decisions, and specializing a rule narrows the advice rather than the measure.
 *
 * Restating the exclusion in the sibling standards was the alternative for what
 * gates here. It duplicates one knowledge item across three surfaces, which the
 * root instruction file forbids, and pointing is not available because the
 * surface they would point at is the one disclaiming them.
 */
export const PROVENANCE_FOLDER = 'context'

export type ProvenanceKind = 'date' | 'change' | 'release'

export interface TableFinding {
  readonly line: number
  readonly rows: number
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
   * blocks. It shares `renderedHeight` with the depth checkpoint in
   * `src/markdown/structure.ts`, since the two sit in one section of the
   * standard and a reader compares them.
   *
   * Fences are counted here and excluded there. The depth measure skips one so
   * an example cannot break the run around it, and a file measure has no run to
   * protect. Excluding them here would change which entries report by one and
   * would not reach the case that motivates it: the most fenced entry in the
   * corpus runs 20 percent fenced and sits past the checkpoint either way.
   */
  readonly lines: number
  readonly catalogTables: readonly TableFinding[]
  /** Empty for an entry no standard bans a change narrative in. */
  readonly provenance: readonly ProvenanceFinding[]
  /**
   * Required sections this entry declares, in the standard's order, and empty
   * outside the folder whose standard names them. What the folder is short of
   * is `missingSections`, since one entry answers for its siblings.
   */
  readonly sections: readonly string[]
  /**
   * Whether the file declares itself a skeleton, which excludes it from the
   * section check alone. Every other measure still reads it, since a stub is
   * exempt from owing sections rather than from being well formed.
   */
  readonly stub: boolean
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
function catalogTables(entry: readonly BodyLine[]): TableFinding[] {
  const findings: TableFinding[] = []
  const lines = entry.filter((line) => !line.fenced)
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!TABLE_ROW.test(line.text)) {
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

  for (const line of lines) {
    if (line.fenced) continue

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

  for (const line of lines) {
    if (line.fenced) continue

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

  return {
    rel,
    lines: source
      .replace(/\n$/, '')
      .split('\n')
      .reduce((sum, text) => sum + renderedHeight(text), 0),
    catalogTables: catalogTables(lines),
    provenance: governsContent ? provenance(lines) : [],
    sections: governsContent ? declaredSections(lines) : [],
    stub: isStubSeed(source),
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

    // A stub owes no sections, so it is dropped before either branch rather
    // than inside them. Leaving one in the split-folder aggregate would let a
    // skeleton answer for the siblings that do owe the sections.
    const reports = folder.entries
      .map((path) => byRel.get(relative(root, path)))
      .filter((entry) => entry !== undefined)
      .filter((entry) => !entry.stub)

    if (reports.length === 0) continue

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
