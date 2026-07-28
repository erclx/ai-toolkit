import { existsSync } from 'node:fs'
import { readField, readFrontmatter } from '@/indexes/frontmatter'
import { computeIndex } from '@/indexes/render'
import { INDEX_FILE } from '@/indexes/walk'

export const REGEN_ACTIONS = [
  'written',
  'would-write',
  'unchanged',
  'skipped',
  'error',
] as const

export type RegenAction = (typeof REGEN_ACTIONS)[number]

export interface RegenResult {
  readonly path: string
  readonly action: RegenAction
  readonly reason?: string
  readonly errors?: string[]
}

export interface RegenOptions {
  readonly dryRun: boolean
}

/**
 * Regenerates one folder's index and reports what happened.
 *
 * A folder marked `auto: false` is skipped rather than errored, which is how
 * hand-maintained catalogs opt out of the walker.
 */
export async function regenOne(
  dir: string,
  options: RegenOptions,
): Promise<RegenResult> {
  const path = `${dir}/${INDEX_FILE}`

  if (!existsSync(path)) {
    return { path, action: 'error', reason: 'no index.md' }
  }

  const auto = readField(await readFrontmatter(path), 'auto')
  if (auto === 'false') {
    return { path, action: 'skipped', reason: 'auto:false' }
  }

  const rendered = await computeIndex(dir)
  if (!rendered.ok) {
    return {
      path,
      action: 'error',
      reason: 'frontmatter',
      errors: rendered.errors,
    }
  }

  if (rendered.content === (await Bun.file(path).text())) {
    return { path, action: 'unchanged' }
  }

  if (options.dryRun) {
    return { path, action: 'would-write' }
  }

  await Bun.write(path, rendered.content)
  return { path, action: 'written' }
}

/**
 * Maps a run's results onto the documented exit codes: 0 clean, 1 error,
 * 2 drift found under `--dry-run`. Skills branch on the JSON instead, but the
 * codes are load-bearing for `bun run check`.
 */
export function exitCodeFor(
  results: readonly RegenResult[],
  options: RegenOptions,
): 0 | 1 | 2 {
  if (results.some((result) => result.action === 'error')) return 1
  if (options.dryRun && results.some((r) => r.action === 'would-write')) {
    return 2
  }
  return 0
}
