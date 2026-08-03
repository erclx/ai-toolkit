import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import type { StandardsSource } from '@/standards/install'

export const ALL_SELECTION = 'all'

export interface Citations {
  /** Siblings the body depends on, which the closure follows. */
  readonly cited: readonly string[]
  /** Siblings a `Does not govern:` entry hands off to, which it does not. */
  readonly delegated: readonly string[]
}

export interface StandardsSelection {
  readonly files: readonly StandardsSource[]
  /** What the caller named, in the order the flat root lists it. */
  readonly requested: readonly string[]
  /** What a requested standard cites and the caller did not name. */
  readonly added: readonly string[]
  /** Handoff targets that did not land, so their pointers will not resolve. */
  readonly unresolved: readonly string[]
}

export type SelectionResult =
  | { readonly ok: true; readonly selection: StandardsSelection }
  | { readonly ok: false; readonly unknown: readonly string[] }

const CITATION = /`([^`\n]+?\.md)`/g
const DELEGATION_START = /^Does not govern:/
const HEADING = /^#{1,6}\s/

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
 * Splits a body at the `Does not govern:` list, which runs to the next heading.
 * Every standard in the flat root carries exactly one, directly under `## Scope`.
 */
function splitDelegatedScope(body: string): {
  governing: string
  delegated: string
} {
  const governing: string[] = []
  const delegated: string[] = []
  let inDelegation = false

  for (const line of body.split('\n')) {
    if (DELEGATION_START.test(line)) inDelegation = true
    else if (inDelegation && HEADING.test(line)) inDelegation = false

    if (inDelegation) delegated.push(line)
    else governing.push(line)
  }

  return { governing: governing.join('\n'), delegated: delegated.join('\n') }
}

function matchNames(text: string, available: ReadonlySet<string>): string[] {
  const found = new Set<string>()

  for (const match of text.matchAll(CITATION)) {
    const token = match[1]
    if (token === undefined) continue

    const name = basename(token)
    if (available.has(name)) found.add(name)
  }

  return [...found]
}

/**
 * Reads the sibling standards a body cites, split by whether the citation is a
 * dependency or a handoff. A citation is a backticked token ending in `.md`,
 * which is the only place either relationship is written, so the parse is a
 * heuristic and every candidate is resolved against `available` before it
 * counts. That resolution is what drops a fenced example, a target project's
 * `.claude/ARCHITECTURE.md`, and a bundled standard the flat root does not
 * install, none of which a selection should pull in.
 *
 * A citation inside the `Does not govern:` list is `delegated` rather than
 * `cited`, because that entry says the sibling owns a concern this standard
 * does not. Expanding on it pulls in a file the caller declined by not naming
 * it, and nearly all the corpus density sits in those lists, which is what
 * collapsed every selection into the whole corpus. A name appearing in the list
 * and also outside it stays `cited`, since a real dependency outranks a handoff.
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
): Citations {
  const { governing, delegated } = splitDelegatedScope(body)
  const cited = matchNames(governing, available)
  const citedSet = new Set(cited)

  return {
    cited,
    delegated: matchNames(delegated, available).filter(
      (name) => !citedSet.has(name),
    ),
  }
}

/**
 * Expands a selection to the transitive closure of what it cites, so an install
 * cannot land a standard whose citations dangle. `all` and an empty selection
 * both mean every standard, which is what keeps the existing callers unchanged.
 *
 * The closure follows dependencies alone. A `Does not govern:` handoff names a
 * concern the caller declined by not selecting it, so the target stays out and
 * is reported through `unresolved` instead. Following those too pulls the whole
 * corpus in behind any single name.
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
        unresolved: [],
      },
    }
  }

  const requested = parseSelection(selection)
  const unknown = requested.filter((name) => !byName.has(name))
  if (unknown.length > 0) return { ok: false, unknown }

  const names = new Set(byName.keys())
  const resolved = new Set(requested)
  const handoffs = new Set<string>()
  const queue = [...requested]

  for (let index = 0; index < queue.length; index += 1) {
    const name = queue[index]
    if (name === undefined) continue

    const file = byName.get(name)
    if (file === undefined) continue

    const citations = citedStandards(readFileSync(file.path, 'utf8'), names)
    for (const handoff of citations.delegated) handoffs.add(handoff)

    for (const cited of citations.cited) {
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
      unresolved: available
        .filter((file) => handoffs.has(file.name) && !resolved.has(file.name))
        .map((file) => file.name),
    },
  }
}
