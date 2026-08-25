import { existsSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import type { InstalledFile, RetiredSurface, SyncAdapter } from '@/sync/engine'

const RETIRED_GOV_FILE = join('.claude', 'GOV.md')

export function rulesSourceDir(root: string): string {
  return join(root, 'governance', 'rules')
}

/**
 * Maps a rule name to its source file. The bash used
 * `find governance/rules -name "<rule>.md" | head -n 1` once per installed
 * rule, which walked the whole tree per file and returned whichever match
 * the filesystem happened to yield first. Indexing once makes the walk single
 * pass and the winner deterministic when a name appears in two subdirectories.
 */
export function indexSourceRules(root: string): Map<string, string> {
  const dir = rulesSourceDir(root)
  const index = new Map<string, string>()
  if (!existsSync(dir)) return index

  const paths = [
    ...new Bun.Glob('**/*.md').scanSync({
      cwd: dir,
      onlyFiles: true,
      dot: true,
    }),
  ].sort()

  for (const path of paths) {
    const name = basename(path, '.md')
    if (!index.has(name)) index.set(name, resolve(dir, path))
  }

  return index
}

/**
 * Matches installed rules to sources by rule name rather than by relative
 * path, so a rule that moved between subdirectories in the toolkit still
 * syncs into the subdirectory the target already uses.
 */
export function createGovAdapter(root: string): SyncAdapter {
  const index = indexSourceRules(root)

  return {
    banner: 'aitk gov sync',
    label: 'rules',
    missingMessage:
      "No governance surfaces found in target. Run 'aitk gov install' first.",
    unit: 'changes',
    installedRoot: (target: string) => join(target, '.claude', 'rules'),
    locateSource: (file: InstalledFile) =>
      index.get(basename(file.path, '.md')),
    collectRetired: (target: string) => collectRetiredGov(target),
    projectSubdir: 'project',
    stamp: { domain: 'governance', toolkitRoot: root },
  }
}

function collectRetiredGov(target: string): RetiredSurface[] {
  const path = join(target, RETIRED_GOV_FILE)
  if (!existsSync(path)) return []

  const rel = relative(target, path)
  return [
    {
      path,
      rel,
      notice: `${rel} (retired surface, scheduled for removal)`,
    },
  ]
}
