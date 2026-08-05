import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { writeChainStamp } from '@/sync/stamp'
import type { Manifest } from '@/tooling/manifest'
import { readPackage } from '@/tooling/package'

/**
 * Whether the target is a workspace root, where every package resolves its own
 * stack. `package.json` covers bun, npm, and yarn, and pnpm declares the same
 * fact in its own file instead.
 */
export function isWorkspaceRoot(target: string): boolean {
  if (existsSync(join(target, 'pnpm-workspace.yaml'))) return true

  const workspaces = readPackage(join(target, 'package.json'))?.workspaces
  return Array.isArray(workspaces) || isRecord(workspaces)
}

/**
 * Records the chain an install resolved, and returns whether it wrote one. A
 * workspace root is the single refusal: one chain recorded there would be a
 * guess at what its packages hold, and the report reading tooling as unmeasured
 * is the true answer rather than a clean one.
 */
export async function recordToolingChain(
  toolkitRoot: string,
  target: string,
  chain: readonly Manifest[],
  now: Date,
): Promise<boolean> {
  if (isWorkspaceRoot(target)) return false

  await writeChainStamp(
    target,
    toolkitRoot,
    chain.map((manifest) => manifest.name),
    now,
  )
  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
