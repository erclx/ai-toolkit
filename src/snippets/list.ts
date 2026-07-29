import { listCategories, listEntries } from '@/snippets/categories'
import { loadPresets } from '@/snippets/presets'

export interface CategoryCatalogEntry {
  readonly name: string
  readonly entries: readonly string[]
}

export interface SnippetsCatalog {
  readonly presets: readonly {
    readonly name: string
    readonly slugs: readonly string[]
  }[]
  readonly categories: readonly CategoryCatalogEntry[]
}

/**
 * Builds the catalog both output modes read, so the human list and the `--json`
 * one cannot describe different corpora.
 */
export function buildSnippetsCatalog(root: string): SnippetsCatalog {
  return {
    presets: loadPresets(root).map((preset) => ({
      name: preset.name,
      slugs: preset.slugs,
    })),
    categories: listCategories(root).map((name) => ({
      name,
      entries: listEntries(root, name),
    })),
  }
}
