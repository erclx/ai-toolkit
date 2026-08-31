import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Where a project declares its pull request label map, spelled once.
 *
 * The file has already moved once, and that relocation rewrote every mention
 * across four surfaces. Nothing in code spells it anywhere else, so the next
 * move is one edit here rather than a sweep.
 */
export const MAP_REL = join('.claude', 'canon', 'pr-labels.toml')

/** A label name and the path prefixes that earn it, in the map's own order. */
export interface DomainRow {
  readonly label: string
  readonly prefixes: readonly string[]
}

/** A reason a path is deliberately unlabelled, and the prefixes it covers. */
export interface DeclinedRow {
  readonly reason: string
  readonly prefixes: readonly string[]
}

/**
 * Why a map could not be read, which is never the same as a map with no rows.
 *
 * `no-map` is an answer rather than a fault. A project declaring no map is
 * labelled silently by design, so a refusal read as a break would make the map
 * mandatory for every target, which that decision declined. The other two are
 * a file that exists and cannot be used, which is a defect in the map itself.
 */
export type MapRefusal = 'no-map' | 'unreadable-map' | 'no-domains'

export type LabelMap =
  | {
      readonly kind: 'map'
      readonly domains: readonly DomainRow[]
      readonly declined: readonly DeclinedRow[]
    }
  | { readonly kind: 'refused'; readonly reason: MapRefusal }

/**
 * Reads a TOML table of string arrays into rows, dropping any key whose value
 * carries no usable prefix.
 *
 * A malformed row is skipped rather than refused, because both tables are
 * authored by hand and one bad entry should not blind the check to the other
 * forty. What it costs is that a typo reads as a row nobody wrote, which the
 * uncovered report surfaces from the other side.
 */
function readRows(table: unknown): { key: string; prefixes: string[] }[] {
  if (typeof table !== 'object' || table === null || Array.isArray(table)) {
    return []
  }

  const rows: { key: string; prefixes: string[] }[] = []
  for (const [key, value] of Object.entries(table)) {
    if (!Array.isArray(value)) continue
    const prefixes = value.filter(
      (entry): entry is string => typeof entry === 'string' && entry !== '',
    )
    if (prefixes.length > 0) rows.push({ key, prefixes })
  }

  return rows
}

/** Parses map text, so a caller holding the bytes skips the filesystem. */
export function parseLabelMap(source: string): LabelMap {
  let parsed: Record<string, unknown>
  try {
    parsed = Bun.TOML.parse(source) as Record<string, unknown>
  } catch {
    return { kind: 'refused', reason: 'unreadable-map' }
  }

  const domains = readRows(parsed.domains)
  if (domains.length === 0) return { kind: 'refused', reason: 'no-domains' }

  return {
    kind: 'map',
    domains: domains.map(({ key, prefixes }) => ({ label: key, prefixes })),
    declined: readRows(parsed.declined).map(({ key, prefixes }) => ({
      reason: key,
      prefixes,
    })),
  }
}

/** Reads the map a project declares at `root`, or says why it could not. */
export function readLabelMap(root: string): LabelMap {
  let source: string
  try {
    source = readFileSync(join(root, MAP_REL), 'utf8')
  } catch {
    return { kind: 'refused', reason: 'no-map' }
  }

  return parseLabelMap(source)
}
