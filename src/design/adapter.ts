import { basename, join } from 'node:path'
import { DESIGN_BASE_CSS } from '@/design/regen'
import type { InstalledFile, SyncAdapter } from '@/sync/engine'

/**
 * The channel a design value reaches a target on.
 *
 * Base plus a target-owned override, reconciled by the three-way merge the sync
 * engine already implements. Overwrite was dropped before this was built and
 * the reason is a measurement rather than an argument: a headless sync in
 * another domain deleted a deploy job, replaced a screenshot harness, and
 * reverted a shipped fix, because naming a stack was read as consent to lose an
 * edit inside it.
 *
 * Layering is what bounds what the merge has to arbitrate. Nothing a project
 * wrote lives in the base, so the base changes freely, and the merge shrinks to
 * the properties a target actually overrode.
 */

/** The folder a design install writes into, under the target's `.claude/`. */
export const DESIGN_INSTALL_DIR = join('.claude', 'design')

/**
 * Where a target's own values go. `projectSubdir` makes every file here
 * project-authored by location rather than by the name inference, so an
 * override named `base.css` is still the target's and never overwritten.
 *
 * It ships absent rather than empty. An empty override is a file a project did
 * not ask for and did not write, the merge already handles a missing side, and
 * an empty file invites a target to fill it before it has an opinion.
 */
export const DESIGN_PROJECT_SUBDIR = 'project'

export function designSourceDir(root: string): string {
  return join(root, 'src', 'design')
}

export function createDesignAdapter(root: string): SyncAdapter {
  const base = join(root, DESIGN_BASE_CSS)

  return {
    banner: 'canon design sync',
    label: 'design',
    missingMessage:
      "No design surface found in target. Run 'canon design install' first.",
    unit: 'changes',
    installPattern: '**/*.css',
    installedRoot: (target: string) => join(target, DESIGN_INSTALL_DIR),
    /**
     * One shipped file, matched by name the way the gov adapter matches a rule,
     * so a base that moved inside the toolkit still syncs into the place the
     * target already holds it.
     */
    locateSource: (file: InstalledFile) =>
      basename(file.path) === basename(base) ? base : undefined,
    projectSubdir: DESIGN_PROJECT_SUBDIR,
    stamp: { domain: 'design', toolkitRoot: root },
  }
}
