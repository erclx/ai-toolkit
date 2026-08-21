import { $ } from 'bun'
import { gitEnv } from '@/git-env'

/**
 * Preferred first, matching `src/gov/test-order.ts` and `src/tasks/trunk.ts`. A
 * local `main` trailing the remote pulls other people's merged commits into the
 * range, so a check reading it decides against files the branch never touched.
 */
const TRUNK_REFS = ['origin/main', 'main'] as const

/** Runs git under `root` with the resolution variables a hook exports stripped. */
async function git(
  root: string,
  args: readonly string[],
): Promise<string | undefined> {
  const result = await $`git -C ${root} ${args}`.env(gitEnv()).quiet().nothrow()
  return result.exitCode === 0 ? result.text().trimEnd() : undefined
}

/**
 * The far side of a branch range: the ref a caller named, or the merge base
 * against the first trunk this repository carries.
 *
 * A named ref that resolves to nothing refuses rather than falling back, since
 * measuring the trunk range instead would answer a question nobody asked.
 */
export async function resolveBaseRef(
  root: string,
  ref?: string,
): Promise<string | undefined> {
  if (ref !== undefined) {
    const resolved = await git(root, [
      'rev-parse',
      '--verify',
      '--quiet',
      `${ref}^{commit}`,
    ])
    return resolved === undefined || resolved === '' ? undefined : resolved
  }

  for (const trunk of TRUNK_REFS) {
    const merged = await git(root, ['merge-base', 'HEAD', trunk])
    if (merged !== undefined && merged !== '') return merged
  }

  return undefined
}

/**
 * Every path a branch has touched since `base`: the diff against the working
 * tree, plus untracked files git does not ignore.
 *
 * The working tree rather than `HEAD` on purpose. A check that runs before the
 * branch is committed has to see the surface a session just added, and reading
 * `HEAD` there returns a set the working tree has already moved past. Since the
 * range is a superset of `base..HEAD`, a caller running after the commits still
 * gets the whole branch.
 *
 * Returns undefined when git cannot answer, for the reason
 * `listRepositoryFiles` states: an empty list reads as a clean branch.
 */
export async function listChangedFiles(
  root: string,
  base: string,
): Promise<string[] | undefined> {
  const changed = await git(root, ['diff', '--name-only', base])
  const untracked = await git(root, [
    'ls-files',
    '--others',
    '--exclude-standard',
  ])
  if (changed === undefined || untracked === undefined) return undefined

  const paths = [...changed.split('\n'), ...untracked.split('\n')]
  return [...new Set(paths.filter(Boolean))].sort()
}

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
