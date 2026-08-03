import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import type { StandardsSource } from '@/standards/install'

export const ALL_SELECTION = 'all'

export interface StandardsSelection {
  readonly files: readonly StandardsSource[]
  /** What the caller named, in the order the flat root lists it. */
  readonly requested: readonly string[]
  /** What a requested standard cites and the caller did not name. */
  readonly added: readonly string[]
}

export type SelectionResult =
  | { readonly ok: true; readonly selection: StandardsSelection }
  | { readonly ok: false; readonly unknown: readonly string[] }

const CITATION = /`([^`\n]+?\.md)`/g

/** Accepts `prose` and `prose.md` alike, since the catalog lists both spellings. */
export function normalizeName(raw: string): string {
  const name = raw.trim()
  return name.endsWith('.md') ? name : `${name}.md`
}

export function parseSelection(csv: string): string[] {
  return csv
    .split(',')
    .map((raw) => raw.trim())
    .filter((raw) => raw !== '')
    .map(normalizeName)
}

/**
 * Reads the sibling standards a body cites. A citation is a backticked token
 * ending in `.md`, which is the only place the dependency is written, so the
 * parse is a heuristic and every candidate is resolved against `available`
 * before it counts. That resolution is what drops a fenced example, a target
 * project's `.claude/ARCHITECTURE.md`, and a bundled standard the flat root
 * does not install, none of which a selection should pull in.
 *
 * Matching is case-exact against the listing rather than a filesystem probe,
 * because a case-insensitive volume would otherwise resolve `SKILL.md` onto
 * `skill.md` and expand a selection on a citation that names a target's own
 * file. The basename is what resolves, so `standards/versioning.md` and a bare
 * `versioning.md` read as the same dependency.
 */
export function citedStandards(
  body: string,
  available: ReadonlySet<string>,
): string[] {
  const cited = new Set<string>()

  for (const match of body.matchAll(CITATION)) {
    const token = match[1]
    if (token === undefined) continue

    const name = basename(token)
    if (available.has(name)) cited.add(name)
  }

  return [...cited]
}

/**
 * Expands a selection to the transitive closure of what it cites, so an install
 * cannot land a standard whose citations dangle. `all` and an empty selection
 * both mean every standard, which is what keeps the existing callers unchanged.
 *
 * An unrecognized name fails the whole selection rather than being dropped with
 * a warning, unlike `--skip` on `aitk init`. A typo here silently omits a
 * standard the caller asked for, and the closure would then be computed over
 * the wrong set.
 */
export function selectStandards(
  available: readonly StandardsSource[],
  selection: string,
): SelectionResult {
  const byName = new Map(available.map((file) => [file.name, file]))

  if (selection.trim() === '' || selection.trim() === ALL_SELECTION) {
    return {
      ok: true,
      selection: {
        files: available,
        requested: available.map((file) => file.name),
        added: [],
      },
    }
  }

  const requested = parseSelection(selection)
  const unknown = requested.filter((name) => !byName.has(name))
  if (unknown.length > 0) return { ok: false, unknown }

  const names = new Set(byName.keys())
  const resolved = new Set(requested)
  const queue = [...requested]

  for (let index = 0; index < queue.length; index += 1) {
    const name = queue[index]
    if (name === undefined) continue

    const file = byName.get(name)
    if (file === undefined) continue

    for (const cited of citedStandards(
      readFileSync(file.path, 'utf8'),
      names,
    )) {
      if (resolved.has(cited)) continue

      resolved.add(cited)
      queue.push(cited)
    }
  }

  const requestedSet = new Set(requested)

  return {
    ok: true,
    selection: {
      files: available.filter((file) => resolved.has(file.name)),
      requested: available
        .filter((file) => requestedSet.has(file.name))
        .map((file) => file.name),
      added: available
        .filter(
          (file) => resolved.has(file.name) && !requestedSet.has(file.name),
        )
        .map((file) => file.name),
    },
  }
}
