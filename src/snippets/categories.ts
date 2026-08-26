import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isDirectory } from '@/target'

export const BASE_CATEGORY = 'base'
/** A real category resolving to zero entries, for a caller declining on purpose. */
export const NONE_CATEGORY = 'none'

export function snippetsSourceDir(root: string): string {
  return join(root, 'snippets')
}

/**
 * Lists the folder categories. `base` is the synthetic name for snippets
 * sitting directly under `snippets/`, so it is not a directory and callers
 * prepend it themselves.
 *
 * Nothing is filtered: toolkit-internal snippets are authored under `internal/`,
 * which this never reads, so every category found here is publishable.
 */
export function listFolderCategories(root: string): string[] {
  const dir = snippetsSourceDir(root)
  if (!isDirectory(dir)) return []

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

export function listCategories(root: string): string[] {
  return [BASE_CATEGORY, ...listFolderCategories(root)]
}

export function categoryDir(root: string, category: string): string {
  const source = snippetsSourceDir(root)
  return category === BASE_CATEGORY ? source : join(source, category)
}

/**
 * Tests for a directory rather than mere existence. `snippets/` holds files
 * alongside its category folders, so an argument naming one of them resolves
 * to a real path that cannot be scanned as a category.
 *
 * An empty category refuses rather than resolving, since `join(source, '')`
 * is `source` and would otherwise report the base directory as the category,
 * widening an unset value to every base entry instead of naming none.
 */
export function categoryExists(root: string, category: string): boolean {
  if (category === '') return false
  return isDirectory(categoryDir(root, category))
}

/**
 * Lists one category's entry slugs. Only the immediate level is read, matching
 * the `find -maxdepth 1` the bash used, so a nested folder is its own category
 * rather than part of its parent.
 */
export function listEntries(root: string, category: string): string[] {
  const dir = categoryDir(root, category)
  if (!isDirectory(dir)) return []

  return [...new Bun.Glob('*.md').scanSync({ cwd: dir, onlyFiles: true })]
    .map((name) => name.slice(0, -'.md'.length))
    .sort()
}
