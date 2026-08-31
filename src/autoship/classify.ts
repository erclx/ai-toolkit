import {
  BEHAVIOR_FILES,
  BEHAVIOR_PREFIXES,
  PROSE_EXTENSIONS,
} from '@/autoship/paths'

/**
 * Which of the two tests a file failed.
 *
 * Named apart rather than folded into one boolean, because the repair differs.
 * A non-prose extension means the branch carries code and review is ordinary. A
 * behavior path means prose that states what an agent does, which is the half
 * three sessions read past.
 */
export type FailedTest = 'extension' | 'behavior-path'

/** Why a classification produced no reading. */
export type ClassifyRefusal = 'no-changes'

export type Classification =
  | { readonly kind: 'skip' }
  | {
      readonly kind: 'review'
      readonly test: FailedTest
      readonly file: string
    }
  | { readonly kind: 'refused'; readonly reason: ClassifyRefusal }

/**
 * Prefix-anchored against the folders, matching how `resolveCoverage` reads the
 * label map, and equality against the whole paths a prefix cannot reach.
 */
function underBehaviorPath(path: string): boolean {
  if (BEHAVIOR_FILES.some((file) => file === path)) return true
  return BEHAVIOR_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function readsAsProse(path: string): boolean {
  const lowered = path.toLowerCase()
  return PROSE_EXTENSIONS.some((extension) => lowered.endsWith(extension))
}

/**
 * Decides whether a branch's changed set skips the review pass.
 *
 * The skip needs both tests to pass: every name reads as prose, and no name
 * sits under a behavior path. One behavior file sends the whole branch to
 * review, since documentation shipped beside a behavior change does not cancel
 * it.
 *
 * An empty set refuses rather than skipping. Both tests are universally
 * quantified, so an empty set satisfies them vacuously, and reading that as
 * prose-only would route a branch past review for having produced no output at
 * all.
 *
 * Names only. The caller hands the set the ship chain already computed, so no
 * second baseline is read here and the stale-baseline half stays closed.
 */
export function classifyChanges(paths: readonly string[]): Classification {
  if (paths.length === 0) return { kind: 'refused', reason: 'no-changes' }

  // First failure in the caller's order wins, and each file is tested for its
  // extension before its path. A set failing both tests reports one file and
  // one test, which is all the branch needs to route.
  for (const path of paths) {
    if (!readsAsProse(path)) {
      return { kind: 'review', test: 'extension', file: path }
    }
    if (underBehaviorPath(path)) {
      return { kind: 'review', test: 'behavior-path', file: path }
    }
  }

  return { kind: 'skip' }
}
