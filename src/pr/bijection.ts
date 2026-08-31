import { extractKeyChangePaths, KEY_CHANGES, type PathClaim } from '@/pr/paths'

/**
 * Why the comparison produced no reading.
 *
 * The three are apart because each names a different repair. `no-section` is a
 * body missing the heading, `no-claims` is the extractor failing over a section
 * full of prose, and `no-changes` is a pull request with no files. Folding any
 * of them into a clean pass is the failure this check exists to prevent, since
 * a reader cannot tell a check that found nothing from one that read nothing.
 */
export type BijectionRefusal = 'no-section' | 'no-claims' | 'no-changes'

export interface BijectionReport {
  readonly kind: 'measured'
  /** The commit the changed set was read at, which a finding has to name. */
  readonly head: string | undefined
  readonly changed: readonly string[]
  readonly claims: readonly PathClaim[]
  /**
   * Anchored claims no changed file answers, which is the graded direction. A
   * bullet naming an untouched file is wrong more often than not, and this
   * corpus reported zero of them across 23 correct bodies.
   */
  readonly unmet: readonly PathClaim[]
  /**
   * Claims whose first segment names no entry in the tree, so the comparison
   * could not judge them either way. Reported so a run says what it declined
   * rather than counting a partial spelling as met.
   */
  readonly unresolved: readonly PathClaim[]
  /**
   * Changed files no claim reaches. Reported without a severity, since the
   * class covers a real omission and equally a lockfile, a generated asset, or
   * a regenerated index that legitimately earns no bullet.
   */
  readonly unnamed: readonly string[]
}

export type Bijection =
  | BijectionReport
  | { readonly kind: 'refused'; readonly reason: BijectionRefusal }

export interface BijectionInput {
  readonly body: string
  readonly changed: readonly string[]
  /** Top-level entries the tree holds, which decides what counts as anchored. */
  readonly roots: ReadonlySet<string>
  readonly head?: string
  readonly title?: string
}

/**
 * Whether one changed path is the file, or a file under the folder, a claim
 * names.
 *
 * An unanchored claim matches on a segment-anchored suffix, which is what lets
 * `claude-worker/SKILL.md` credit `claude/skills/claude-worker/SKILL.md`. That
 * asymmetry is deliberate: a partial spelling can confirm a changed file was
 * named and never accuse one of being absent, because nothing here separates a
 * path written short from a path written wrong.
 */
function covers(claim: PathClaim, path: string): boolean {
  if (claim.directory) {
    return claim.anchored
      ? path.startsWith(claim.path)
      : path.includes(`/${claim.path}`)
  }
  if (path === claim.path) return true
  return !claim.anchored && path.endsWith(`/${claim.path}`)
}

/**
 * Compares what a pull request body claims to have changed against what it
 * actually changed, in both directions.
 *
 * The two directions are reported apart because they want different
 * tolerances. A claim nobody made good on is a defect in the record that
 * squash-merges onto the trunk, and a changed file nobody recorded is often
 * correct. Merging them into one count would either grade the second or excuse
 * the first.
 *
 * Pure, so the whole judgment is testable against a fixture. The caller reads
 * the body, the changed set, and the tree roots and hands all three in.
 */
export function compareKeyChanges(input: BijectionInput): Bijection {
  if (input.changed.length === 0)
    return { kind: 'refused', reason: 'no-changes' }

  const read = extractKeyChangePaths(
    input.body,
    input.roots,
    input.title ?? KEY_CHANGES,
  )
  if (read.kind === 'no-section')
    return { kind: 'refused', reason: 'no-section' }
  if (read.claims.length === 0) return { kind: 'refused', reason: 'no-claims' }

  const unmet: PathClaim[] = []
  const unresolved: PathClaim[] = []
  const named = new Set<string>()

  for (const claim of read.claims) {
    const hits = input.changed.filter((path) => covers(claim, path))
    for (const path of hits) named.add(path)
    if (hits.length > 0) continue
    if (claim.anchored) unmet.push(claim)
    else unresolved.push(claim)
  }

  return {
    kind: 'measured',
    head: input.head,
    changed: [...input.changed],
    claims: read.claims,
    unmet,
    unresolved,
    unnamed: input.changed.filter((path) => !named.has(path)),
  }
}

/**
 * The top-level folders a claim may be anchored on: the first segment of every
 * path the tree holds, plus the first segment of every changed path.
 *
 * The changed half is what admits a folder this branch created. Reading the
 * tree alone would mark every claim under a new top-level directory unanchored,
 * and an unanchored claim never accuses, so the first branch to open one would
 * silently lose the graded direction.
 *
 * A path with no folder above it contributes nothing, since a claim carrying no
 * slash never reaches the extractor's output and no root would ever be read
 * against it.
 */
export function treeRoots(
  tracked: readonly string[],
  changed: readonly string[],
): Set<string> {
  const roots = new Set<string>()
  for (const path of [...tracked, ...changed]) {
    const at = path.indexOf('/')
    if (at > 0) roots.add(path.slice(0, at))
  }
  return roots
}
