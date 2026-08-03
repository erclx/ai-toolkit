import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import type { AuditedFolder } from '@/context/folders'

/** Checkpoints quoted from `standards/context.md`. Neither is a cap. */
export const LENGTH_CHECKPOINT = 150
export const RUN_CHECKPOINT = 40

/**
 * A table this size or larger whose first column mostly names artifacts reads
 * as a catalog that grows a row per shipped thing, which is the shape the
 * standard routes to a bullet list. Below it, a table is small enough that a
 * reflow rewrites little.
 */
export const CATALOG_ROW_CHECKPOINT = 6

/** Share of first cells that must name an artifact for a table to qualify. */
const CATALOG_NAMED_RATIO = 0.6

const FRONTMATTER = /^---\n[\s\S]*?\n---\n?/
const FENCE = /^\s*(```|~~~)/
const HEADING = /^#{1,6}\s/
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
  readonly lines: number
  readonly longestRun: number
  /** First line of the longest run, or 0 when the entry has no run at all. */
  readonly longestRunLine: number
  readonly catalogTables: readonly TableFinding[]
  readonly provenance: readonly ProvenanceFinding[]
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
 * means the block is no longer a flat set a reader can skim.
 */
function isPeerList(run: readonly BodyLine[]): boolean {
  const indents = new Set<number>()

  for (const line of run) {
    if (line.text.trim() === '') continue

    const match = line.text.match(LIST_ITEM)
    if (!match) return false
    indents.add(match[1].length)
  }

  return indents.size === 1
}

/**
 * Measures the longest run of lines no heading breaks.
 *
 * Fenced blocks are skipped rather than treated as breaks, per the standard:
 * they leave the count without ending the run, so prose either side of an
 * example still measures as the one stretch a reader scrolls through. Blank
 * lines do count, since the checkpoint is about how far a reader travels
 * between signposts and a blank line is distance like any other. A hand reader
 * measuring without them lands one or two lines lower, which the report legend
 * states.
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

    if (first && run.length > longest && !isPeerList(run)) {
      longest = run.length
      longestLine = first.number
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

export function measureEntry(rel: string, source: string): EntryReport {
  const lines = bodyLines(source)
  const run = longestRun(lines)

  return {
    rel,
    lines: source.replace(/\n$/, '').split('\n').length,
    longestRun: run.length,
    longestRunLine: run.line,
    catalogTables: catalogTables(lines),
    provenance: provenance(lines),
  }
}

/**
 * Measures every entry in the audited folders. A generated `index.md` is not
 * among them, since its body is rewritten on every regen and no checkpoint
 * describes a catalog.
 */
export async function measureFolders(
  root: string,
  folders: readonly AuditedFolder[],
): Promise<EntryReport[]> {
  const reports: EntryReport[] = []

  for (const folder of folders) {
    for (const path of folder.entries) {
      reports.push(
        measureEntry(relative(root, path), await readFile(path, 'utf8')),
      )
    }
  }

  return reports
}
