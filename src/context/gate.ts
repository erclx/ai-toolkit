import type { SectionFinding } from '@/context/audit'
import type { FolderDrift } from '@/context/index-drift'

export interface GateInput {
  /** Cited paths that resolved to nothing, which gate under either mode. */
  readonly unresolvedCitations: number
  readonly sections: readonly SectionFinding[]
  readonly drift: readonly FolderDrift[]
  /**
   * Whether the caller asked for the widened gate. False leaves a missing
   * section and a drifted index advisory, which is what the project-root stage
   * runs so a judgment threshold never fails a push.
   */
  readonly widened: boolean
}

/** Whether any folder disagrees with its own index. */
export function hasDrift(drift: readonly FolderDrift[]): boolean {
  return drift.some(
    (folder) => folder.unlisted.length > 0 || folder.missing.length > 0,
  )
}

/**
 * Whether the audit found something that should fail the caller.
 *
 * An unresolved citation is a broken pointer and gates unconditionally. The two
 * findings `--gate` adds are the ones answerable from the file itself: a
 * required section it does not declare, and an index disagreeing with its
 * folder. Length, depth, bullet, table, and provenance findings are thresholds
 * a reader weighs, so they stay out under both modes.
 */
export function isGating({
  unresolvedCitations,
  sections,
  drift,
  widened,
}: GateInput): boolean {
  if (unresolvedCitations > 0) return true
  if (!widened) return false

  return sections.length > 0 || hasDrift(drift)
}
