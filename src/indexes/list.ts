import { dirname, relative, resolve } from 'node:path'
import { readField, readFrontmatter } from '@/indexes/frontmatter'
import { collectEntries } from '@/indexes/render'
import { listIndexes } from '@/indexes/walk'

export interface CatalogEntry {
  readonly path: string
  readonly title: string
  readonly description: string
}

export interface IndexCatalog {
  readonly entries: CatalogEntry[]
  readonly errors: string[]
}

/**
 * Flattens every folder index under `root` into one queryable catalog.
 *
 * A folder's own frontmatter error lands in `errors` without dropping the
 * rest of the walk, the same isolation `regenOne` gives one folder.
 */
export async function buildIndexCatalog(root: string): Promise<IndexCatalog> {
  const indexPaths = await listIndexes(root)
  const entries: CatalogEntry[] = []
  const errors: string[] = []

  for (const indexPath of indexPaths) {
    const dir = dirname(indexPath)
    const frontmatter = await readFrontmatter(indexPath)
    const title = readField(frontmatter, 'title')
    const subtitle = readField(frontmatter, 'subtitle')

    if (!title || !subtitle) {
      errors.push(
        `missing frontmatter field "title" or "subtitle" in ${indexPath}`,
      )
    } else {
      entries.push({
        path: relative(root, indexPath),
        title,
        description: subtitle,
      })
    }

    const collected = await collectEntries(dir)
    if (!collected.ok) {
      errors.push(...collected.errors)
      continue
    }

    for (const entry of collected.entries) {
      entries.push({
        path: relative(root, resolve(dir, entry.name)),
        title: entry.title,
        description: entry.description,
      })
    }
  }

  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))

  return { entries, errors }
}
