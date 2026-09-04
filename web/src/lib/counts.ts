import { execSync, spawnSync } from 'node:child_process'

interface CatalogCounts {
  skills: number
  rules: number
  standards: number
  snippets: number
  commands: number
  audits: number
}

interface GovCountsOutput {
  catalogs: CatalogCounts
}

/**
 * Reads the live catalog counts from `canon gov counts --json` at build time.
 * No literal fallback: a build without `canon` on PATH, or one whose output
 * carries no parseable count, fails rather than shipping a number nothing
 * measured. A non-zero exit alone is not that failure: the verb exits 2 when
 * it finds a stale count elsewhere in the tree, drift this page's own build
 * neither causes nor is responsible for gating.
 */
export function readCatalogCounts(): CatalogCounts {
  // The build process may start from web/ rather than the repository root,
  // so resolve the root through git rather than assuming a fixed cwd.
  const repoRoot = execSync('git rev-parse --show-toplevel', {
    encoding: 'utf8',
  }).trim()
  const result = spawnSync('canon', ['gov', 'counts', '--json'], {
    encoding: 'utf8',
    cwd: repoRoot,
  })

  if (result.error || !result.stdout) {
    throw new Error(
      `canon gov counts --json produced no output. The page never ships a typed count, so the build cannot continue without it. Underlying error: ${result.error instanceof Error ? result.error.message : (result.stderr ?? 'none')}`,
    )
  }

  const parsed = JSON.parse(result.stdout) as GovCountsOutput
  return parsed.catalogs
}
