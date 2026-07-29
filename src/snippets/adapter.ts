import { existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import type { InstalledFile, SyncAdapter } from '@/sync/engine'

const INTERNAL_CATEGORIES = new Set(['aitk'])

export function snippetsSourceDir(root: string): string {
  return join(root, 'snippets')
}

/**
 * Reads the first path segment as a category. Snippets also live directly under
 * `snippets/`, where that segment is a filename rather than a category, so the
 * check has to tolerate a bare name instead of assuming every entry is nested.
 */
export function isInternalCategory(relToRoot: string): boolean {
  const [top] = relToRoot.split(sep)
  return top !== undefined && INTERNAL_CATEGORIES.has(top)
}

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
  }
}

function locateSource(
  sourceDir: string,
  file: InstalledFile,
): string | undefined {
  if (isInternalCategory(file.relToRoot)) return undefined

  const source = join(sourceDir, file.relToRoot)
  return existsSync(source) ? source : undefined
}
