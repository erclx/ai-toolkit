import { $ } from 'bun'

/**
 * Resolves the root of the checkout the caller is standing in, which is the
 * linked worktree rather than the main one when a session is inside one.
 *
 * A tracked tree differs per worktree, so a verb reading one answers about the
 * files the session has edited only if it resolves the root this way. The
 * working directory is not a substitute, since a caller invoking from a
 * subdirectory would resolve a root holding none of the trees a verb reads.
 */
export async function currentWorktreeRoot(): Promise<string> {
  const result = await $`git rev-parse --show-toplevel`.quiet().nothrow()
  if (result.exitCode !== 0) return process.cwd()

  return result.stdout.toString().trim() || process.cwd()
}

/**
 * Resolves the root every shared-scratch folder lives under. `git worktree
 * list` puts the main worktree first, and trusting the working directory
 * instead would write a second board nothing else reads, or validate a linked
 * worktree's empty folder and report it clean.
 *
 * A caller reaching this from a linked worktree is the case it exists for: the
 * file-editing tools refuse a main-root path there, so a verb resolving the
 * root in-process is the route a skill body has.
 */
export async function mainWorktreeRoot(): Promise<string> {
  const result = await $`git worktree list --porcelain`.quiet().nothrow()
  if (result.exitCode !== 0) return process.cwd()

  const line = result.stdout
    .toString()
    .split('\n')
    .find((entry) => entry.startsWith('worktree '))

  return line ? line.slice('worktree '.length).trim() : process.cwd()
}

export interface WorktreeEntry {
  readonly path: string
  readonly branch: string | null
}

/**
 * Parses `git worktree list --porcelain`, which emits one block per worktree
 * separated by a blank line. A detached worktree carries no `branch` line,
 * reported here as `null` rather than a guessed name.
 */
export async function listWorktrees(
  cwd: string = process.cwd(),
): Promise<readonly WorktreeEntry[]> {
  const result = await $`git -C ${cwd} worktree list --porcelain`
    .quiet()
    .nothrow()
  if (result.exitCode !== 0) return []

  const entries: WorktreeEntry[] = []
  let path: string | undefined
  let branch: string | null = null

  for (const line of result.stdout.toString().split('\n')) {
    if (line.startsWith('worktree ')) {
      if (path !== undefined) entries.push({ path, branch })
      path = line.slice('worktree '.length).trim()
      branch = null
      continue
    }

    if (line.startsWith('branch ')) {
      const ref = line.slice('branch '.length).trim()
      branch = ref.startsWith('refs/heads/')
        ? ref.slice('refs/heads/'.length)
        : ref
    }
  }

  if (path !== undefined) entries.push({ path, branch })

  return entries
}
