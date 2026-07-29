import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { copyPreservingMode } from '@/copy'
import { regenOne } from '@/indexes/regen'
import type { InstalledFile, SyncAdapter } from '@/sync/engine'
import { logAdd, logWarn } from '@/ui'

const STANDARDS_REL = join('.claude', 'standards')
const INDEX_FILE = 'index.md'

export function standardsSourceDir(root: string): string {
  return join(root, 'standards')
}

/**
 * Matches installed standards to sources by filename against the flat
 * `standards/` root. A standard that lives in a source subfolder, such as
 * `bundled/`, has no flat sibling and so reads as project-authored, which is
 * what keeps `install` and `sync` agreeing on the same set.
 *
 * Standards are seeds a project is expected to edit, unlike gov rules and
 * snippets, so a headless run refuses to overwrite drift rather than applying
 * it. That refusal is the reason the engine grew a per-adapter policy.
 */
export function createStandardsAdapter(root: string): SyncAdapter {
  const sourceDir = standardsSourceDir(root)

  return {
    banner: 'aitk standards sync',
    label: 'standards',
    missingMessage:
      "No .claude/standards/ found in target. Run 'aitk standards install' first.",
    unit: 'standards',
    installedRoot: (target: string) => join(target, STANDARDS_REL),
    isExcluded: (file: InstalledFile) => basename(file.path) === INDEX_FILE,
    locateSource: (file: InstalledFile) =>
      locateSource(sourceDir, basename(file.path)),
    nonInteractive: {
      kind: 'refuse',
      message:
        'Drifts detected. Refusing to auto-apply in non-interactive mode.',
      hint: 'Run interactively, or use /claude-seed-sync for per-section audit that preserves customizations.',
    },
    onComplete: (target: string) => refreshIndex(sourceDir, target),
  }
}

function locateSource(sourceDir: string, name: string): string | undefined {
  const source = join(sourceDir, name)
  return existsSync(source) ? source : undefined
}

/**
 * Replaces the target's `index.md` from source and rebuilds it against what
 * actually landed. It runs on every completed sync, including one with no
 * changes, because the catalog can go stale from a file the toolkit stopped
 * shipping rather than from drift in a file it still does.
 */
async function refreshIndex(sourceDir: string, target: string): Promise<void> {
  const installedDir = join(target, STANDARDS_REL)
  const source = join(sourceDir, INDEX_FILE)

  if (!existsSync(source)) {
    logWarn(`No ${INDEX_FILE} in toolkit standards, leaving the target catalog`)
    return
  }

  await copyPreservingMode(source, join(installedDir, INDEX_FILE))
  const result = await regenOne(installedDir, { dryRun: false })

  if (result.action === 'error') {
    logWarn(`${join(STANDARDS_REL, INDEX_FILE)} regen failed: ${result.reason}`)
    return
  }

  logAdd(join(STANDARDS_REL, INDEX_FILE))
}
