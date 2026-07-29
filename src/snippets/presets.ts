import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { snippetsSourceDir } from '@/snippets/categories'

export interface Preset {
  readonly name: string
  readonly slugs: readonly string[]
}

export function presetsPath(root: string): string {
  return join(snippetsSourceDir(root), 'snippets.toml')
}

/**
 * Reads every preset from `snippets.toml`. The bash read section headers with
 * `grep '^\['` and then re-walked the file per preset with a `BASH_REMATCH`
 * loop, so a name carrying a bracket or a slug split across lines parsed by
 * accident rather than by rule.
 */
export function loadPresets(root: string): Preset[] {
  const path = presetsPath(root)
  if (!existsSync(path)) return []

  const parsed = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<
    string,
    unknown
  >
  const presets: Preset[] = []

  for (const [name, table] of Object.entries(parsed)) {
    if (typeof table !== 'object' || table === null || Array.isArray(table)) {
      continue
    }
    const names = (table as Record<string, unknown>).names
    presets.push({
      name,
      slugs: Array.isArray(names)
        ? names.filter(
            (slug): slug is string => typeof slug === 'string' && slug !== '',
          )
        : [],
    })
  }

  return presets.sort((left, right) => left.name.localeCompare(right.name))
}

export function findPreset(root: string, name: string): Preset | undefined {
  return loadPresets(root).find((preset) => preset.name === name)
}
