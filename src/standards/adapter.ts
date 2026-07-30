import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import {
  INDEX_FILE,
  refreshIndex,
  standardsInstallDir,
} from '@/standards/index-refresh'
import type { InstalledFile, SyncAdapter } from '@/sync/engine'

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
    installedRoot: standardsInstallDir,
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
    stamp: { domain: 'standards', toolkitRoot: root },
  }
}

function locateSource(sourceDir: string, name: string): string | undefined {
  const source = join(sourceDir, name)
  return existsSync(source) ? source : undefined
}
