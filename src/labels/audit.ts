import { listChangedFiles, resolveBaseRef } from '@/git-files'
import { type Coverage, resolveCoverage } from '@/labels/coverage'
import { type MapRefusal, readLabelMap } from '@/labels/map'

/**
 * Why an audit produced no reading.
 *
 * `no-map` travels through from the map reader and stays an answer rather than
 * a fault. The two git reasons are the opposite: a range this check asked for
 * and could not get, which is a broken invocation rather than a project that
 * declared nothing.
 */
export type LabelAuditRefusal = MapRefusal | 'no-base' | 'no-changes'

export type LabelAudit =
  | {
      readonly kind: 'measured'
      /** Absent when the caller supplied the changed set rather than a range. */
      readonly base?: string
      readonly changed: readonly string[]
      readonly coverage: Coverage
    }
  | { readonly kind: 'refused'; readonly reason: LabelAuditRefusal }

export interface LabelAuditOptions {
  /** Far side of the range, defaulting to the merge base against the trunk. */
  readonly base?: string
  /** A changed set the caller already holds, which skips git entirely. */
  readonly paths?: readonly string[]
}

/**
 * Resolves a changed set against the map a project declares, and reports both
 * what it earns and what it leaves uncovered.
 *
 * One verb for two readers by design. `git-pr` reads the labels at open time
 * and the audit aggregate reads the uncovered count, and a verb shaped for the
 * first alone returns nothing the second can retain.
 */
export async function auditLabels(
  root: string,
  options: LabelAuditOptions = {},
): Promise<LabelAudit> {
  const map = readLabelMap(root)
  if (map.kind === 'refused') return { kind: 'refused', reason: map.reason }

  if (options.paths !== undefined) {
    return {
      kind: 'measured',
      changed: [...options.paths],
      coverage: resolveCoverage(map, options.paths),
    }
  }

  const base = await resolveBaseRef(root, options.base)
  if (base === undefined) {
    return { kind: 'refused', reason: 'no-base' }
  }

  const changed = await listChangedFiles(root, base)
  if (changed === undefined) return { kind: 'refused', reason: 'no-changes' }

  return {
    kind: 'measured',
    base,
    changed,
    coverage: resolveCoverage(map, changed),
  }
}
