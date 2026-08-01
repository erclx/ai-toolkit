import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { copyPreservingMode } from '@/copy'
import {
  BASE_CATEGORY,
  categoryDir,
  categoryExists,
  listCategories,
  listEntries,
  snippetsSourceDir,
} from '@/snippets/categories'
import { findPreset, loadPresets } from '@/snippets/presets'

export const ALL_CATEGORY = 'all'

export interface SnippetFile {
  readonly src: string
  readonly relPath: string
}

export type SnippetResolution =
  | {
      readonly ok: true
      readonly step: string
      readonly files: readonly SnippetFile[]
      readonly missing: readonly string[]
    }
  | { readonly ok: false; readonly unknownCategory: string }

export function installedSnippetsDir(target: string): string {
  return join(target, '.claude', 'snippets')
}

/**
 * Derives the destination path. A snippet directly under `snippets/` installs
 * flat and a nested one keeps its immediate parent, so the installed tree
 * mirrors the source one level deep.
 */
export function deriveDestRelPath(root: string, src: string): string {
  const parent = dirname(src)
  const filename = basename(src)

  return parent === snippetsSourceDir(root)
    ? filename
    : `${basename(parent)}/${filename}`
}

function filesInCategory(root: string, category: string): SnippetFile[] {
  return listEntries(root, category).map((slug) => {
    const src = join(categoryDir(root, category), `${slug}.md`)
    return { src, relPath: deriveDestRelPath(root, src) }
  })
}

/**
 * Resolves the one argument three ways. `all` wins, then a preset name, then a
 * folder, which is the bash precedence and matters because a folder sharing a
 * preset name resolves to the preset.
 *
 * Preset slugs pass the internal-category filter too. A slug is a path relative
 * to `snippets/`, so a preset naming `aitk/<slug>` would otherwise reach an
 * internal snippet through the one install path the filter did not cover.
 */
export function resolveSnippets(
  root: string,
  category: string,
): SnippetResolution {
  if (category === ALL_CATEGORY) {
    const files = listCategories(root).flatMap((name) =>
      filesInCategory(root, name),
    )
    return { ok: true, step: 'Resolving all categories', files, missing: [] }
  }

  const preset = findPreset(root, category)
  if (preset) {
    const files: SnippetFile[] = []
    const missing: string[] = []

    for (const slug of preset.slugs) {
      const src = join(snippetsSourceDir(root), `${slug}.md`)
      if (existsSync(src)) files.push({ src, relPath: `${slug}.md` })
      else missing.push(slug)
    }

    return { ok: true, step: `Resolving preset: ${category}`, files, missing }
  }

  if (category !== BASE_CATEGORY && !categoryExists(root, category)) {
    return { ok: false, unknownCategory: category }
  }

  return {
    ok: true,
    step: `Resolving category: ${category}`,
    files: filesInCategory(root, category),
    missing: [],
  }
}

/**
 * Lists everything the picker offers: presets first, then `base`, then the
 * folder categories, matching the order the bash built the menu in.
 */
export function installableCategories(root: string): string[] {
  return [
    ...loadPresets(root).map((preset) => preset.name),
    ...listCategories(root),
  ]
}

export async function installSnippets(
  files: readonly SnippetFile[],
  target: string,
): Promise<string[]> {
  const destDir = installedSnippetsDir(target)
  const installed: string[] = []

  for (const file of files) {
    await copyPreservingMode(file.src, join(destDir, file.relPath))
    installed.push(join('.claude', 'snippets', file.relPath))
  }

  return installed
}
