import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { snippetsSourceDir } from '@/snippets/categories'
import type { InstalledFile, SyncAdapter } from '@/sync/engine'

/**
 * Matches installed snippets to sources by relative path, where gov matches by
 * rule name. `derive_dest_rel_path` in `scripts/snippets/install.sh` keeps the
 * immediate parent for a nested snippet and flattens a root-level one to its
 * filename, which is the shape a source-relative path already has, so
 * destination and source rel paths agree for everything the toolkit ships.
 */
export function createSnippetsAdapter(root: string): SyncAdapter {
  const sourceDir = snippetsSourceDir(root)

  return {
    banner: 'aitk snippets sync',
    label: 'snippets',
    missingMessage:
      "No .claude/snippets/ found in target. Run 'aitk snippets install' first.",
    unit: 'snippets',
    installedRoot: (target: string) => join(target, '.claude', 'snippets'),
    locateSource: (file: InstalledFile) => locateSource(sourceDir, file),
    projectSubdir: 'project',
    stamp: { domain: 'snippets', toolkitRoot: root },
  }
}

function locateSource(
  sourceDir: string,
  file: InstalledFile,
): string | undefined {
  const source = join(sourceDir, file.relToRoot)
  return existsSync(source) ? source : undefined
}
