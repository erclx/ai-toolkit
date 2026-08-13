import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { stripFrontmatter } from '@/frontmatter'
import { PROJECT_ROOT } from '@/project-root'
import { standardsSourceDir } from '@/standards/adapter'
import { INDEX_FILE } from '@/standards/index-refresh'

/**
 * Spells the package root in a report where every other root spells a
 * project-relative path. The `source` field promises a path inside the project
 * and a package copy is the one source that promise cannot cover, so the
 * spelling has to be one nothing will join to a project root.
 */
const PACKAGE_LABEL = '<aitk>'

export interface StandardRoot {
  /** Absolute directory to search. */
  readonly dir: string
  /** How a report spells a copy found under this root. */
  readonly label: string
}

export interface ResolvedStandard {
  readonly path: string
  /** The label of the root that won, joined to the filename. */
  readonly source: string
}

/**
 * The three roots a standard resolves against, in precedence order.
 *
 * A project copy wins wherever one exists. An installed standard is a seed a
 * project edits, so a package copy overriding it would discard that edit with
 * nothing said, and the fallback answers absence rather than staleness. The
 * package root is what lets a project that installed no standards still be
 * measured against one, since `package.json` ships the corpus beside the code
 * doing the reading.
 */
export function standardRoots(root: string): StandardRoot[] {
  return [
    {
      dir: join(root, '.claude', 'standards'),
      label: join('.claude', 'standards'),
    },
    { dir: join(root, 'standards'), label: 'standards' },
    {
      dir: standardsSourceDir(PROJECT_ROOT),
      label: join(PACKAGE_LABEL, 'standards'),
    },
  ]
}

function filename(name: string): string {
  return name.endsWith('.md') ? name : `${name}.md`
}

/** Resolves a standard by name, with or without the extension. */
export function resolveStandard(
  root: string,
  name: string,
): ResolvedStandard | undefined {
  const file = filename(name)

  for (const { dir, label } of standardRoots(root)) {
    const path = join(dir, file)
    if (existsSync(path)) return { path, source: join(label, file) }
  }

  return undefined
}

/**
 * Names every standard a resolve could reach, deduplicated across the roots and
 * sorted. Shown when a name misses, so it doubles as the answer to what the
 * caller should have typed.
 */
export function listStandards(root: string): string[] {
  const names = new Set<string>()

  for (const { dir } of standardRoots(root)) {
    if (!existsSync(dir)) continue

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue
      if (!entry.name.endsWith('.md')) continue
      if (entry.name === INDEX_FILE) continue

      names.add(basename(entry.name, '.md'))
    }
  }

  return [...names].sort()
}

export function readStandard(standard: ResolvedStandard): string {
  return stripFrontmatter(readFileSync(standard.path, 'utf8'))
}
