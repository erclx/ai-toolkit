import { existsSync, readdirSync } from 'node:fs'
import { join, sep } from 'node:path'

const INTERNAL_CATEGORIES = new Set(['aitk'])

export const BASE_CATEGORY = 'base'

export function snippetsSourceDir(root: string): string {
  return join(root, 'snippets')
}

export function isInternalCategoryName(name: string): boolean {
  return INTERNAL_CATEGORIES.has(name)
}

/**
 * Reads the first path segment as a category. Snippets also live directly under
 * `snippets/`, where that segment is a filename rather than a category, so the
 * check has to tolerate a bare name instead of assuming every entry is nested.
 */
export function isInternalCategory(relToRoot: string): boolean {
  const [top] = relToRoot.split(sep)
  return top !== undefined && isInternalCategoryName(top)
}

/**
 * Lists the folder categories, internal ones filtered out. `base` is the
 * synthetic name for snippets sitting directly under `snippets/`, so it is not
 * a directory and callers prepend it themselves.
 */
export function listFolderCategories(root: string): string[] {
  const dir = snippetsSourceDir(root)
  if (!existsSync(dir)) return []

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !isInternalCategoryName(name))
    .sort()
}

export function listCategories(root: string): string[] {
  return [BASE_CATEGORY, ...listFolderCategories(root)]
}

export function categoryDir(root: string, category: string): string {
  const source = snippetsSourceDir(root)
  return category === BASE_CATEGORY ? source : join(source, category)
}

export function categoryExists(root: string, category: string): boolean {
  return existsSync(categoryDir(root, category))
}

/**
 * Lists one category's entry slugs. Only the immediate level is read, matching
 * the `find -maxdepth 1` the bash used, so a nested folder is its own category
 * rather than part of its parent.
 */
export function listEntries(root: string, category: string): string[] {
  const dir = categoryDir(root, category)
  if (!existsSync(dir)) return []

  return [...new Bun.Glob('*.md').scanSync({ cwd: dir, onlyFiles: true })]
    .map((name) => name.slice(0, -'.md'.length))
    .sort()
}
