import { $ } from 'bun'
import { gitEnv } from '@/git-env'

/**
 * Lists the files under `root`: tracked, plus untracked files git does not
 * ignore. The untracked half is what keeps a file added on this branch in scope
 * rather than one push later.
 *
 * Returns undefined when git cannot answer, which every caller reports rather
 * than smoothing into an empty list. An empty list passes each of its zero
 * files, so a degraded git would otherwise be indistinguishable from a clean
 * tree in the output.
 */
export async function listRepositoryFiles(
  root: string,
): Promise<string[] | undefined> {
  const run = async (args: string[]): Promise<string[] | undefined> => {
    const result = await $`git -C ${root} ${args}`
      .env(gitEnv())
      .quiet()
      .nothrow()
    if (result.exitCode !== 0) return undefined
    return result.text().split('\n').filter(Boolean)
  }

  const tracked = await run(['ls-files'])
  const untracked = await run(['ls-files', '--others', '--exclude-standard'])
  if (!tracked || !untracked) return undefined

  return [...new Set([...tracked, ...untracked])].sort()
}
