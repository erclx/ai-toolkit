import { existsSync, readdirSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { copyPreservingMode } from '@/copy'
import { INDEX_FILE, STANDARDS_REL } from '@/standards/index-refresh'

export interface StandardsSource {
  readonly path: string
  readonly name: string
}

/**
 * Lists the flat `standards/` root only, which is the same set the sync adapter
 * matches installed files against. A standard in a source subfolder such as
 * `bundled/` is not installed wholesale, so the two verbs agree on scope.
 *
 * `index.md` is excluded because install copies it separately and then rebuilds
 * it against what landed, rather than shipping the toolkit's own catalog.
 */
export function planInstall(sourceDir: string): StandardsSource[] {
  if (!existsSync(sourceDir)) return []

  return readdirSync(sourceDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        entry.name !== INDEX_FILE,
    )
    .map((entry) => ({ path: join(sourceDir, entry.name), name: entry.name }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

/**
 * Copies every standard and returns the labels to log. Routes through
 * `copyPreservingMode` because the `cp` it replaces left an existing
 * destination's mode alone, so a target file held at 600 stays there.
 */
export async function applyInstall(
  files: readonly StandardsSource[],
  destDir: string,
): Promise<string[]> {
  await mkdir(destDir, { recursive: true })

  await Promise.all(
    files.map((file) =>
      copyPreservingMode(file.path, join(destDir, file.name)),
    ),
  )

  return files.map((file) => join(STANDARDS_REL, file.name))
}
