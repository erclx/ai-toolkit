import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { copyPreservingMode } from '@/copy'
import { regenOne } from '@/indexes/regen'
import { logAdd, logWarn } from '@/ui'

export const STANDARDS_REL = join('.claude', 'standards')
export const INDEX_FILE = 'index.md'

export function standardsInstallDir(target: string): string {
  return join(target, STANDARDS_REL)
}

/**
 * Replaces the target's `index.md` from source and rebuilds it against what
 * actually landed. It runs on every completed install and every completed sync,
 * including one with no changes, because the catalog can go stale from a file
 * the toolkit stopped shipping rather than from drift in a file it still does.
 *
 * `install` and `sync` are peers, so this sits beside both rather than inside
 * the sync adapter, where an install would be importing from the other verb.
 */
export async function refreshIndex(
  sourceDir: string,
  target: string,
): Promise<void> {
  const installedDir = standardsInstallDir(target)
  const source = join(sourceDir, INDEX_FILE)

  if (!existsSync(source)) {
    logWarn(`No ${INDEX_FILE} in toolkit standards, leaving the target catalog`)
    return
  }

  await copyPreservingMode(source, join(installedDir, INDEX_FILE))
  const result = await regenOne(installedDir, { dryRun: false })

  if (result.action === 'error') {
    logWarn(`${join(STANDARDS_REL, INDEX_FILE)} regen failed: ${result.reason}`)
    return
  }

  logAdd(join(STANDARDS_REL, INDEX_FILE))
}
