import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { $ } from 'bun'

const INDEX_FILE = 'index.md'
const PRUNED = ['**/node_modules/**', '**/.git/**']

/**
 * Lists every folder index under `root`, newest git state respected.
 *
 * Ignored paths are dropped via `git check-ignore` rather than a hardcoded
 * list, so a project's own `.gitignore` governs what the walker sees. Outside
 * a git repo every candidate is kept.
 */
export async function listIndexes(root: string): Promise<string[]> {
  const glob = new Bun.Glob(`**/${INDEX_FILE}`)
  const candidates: string[] = []

  for await (const rel of glob.scan({
    cwd: root,
    onlyFiles: true,
    dot: true,
  })) {
    candidates.push(resolve(root, rel))
  }
  candidates.sort()

  if (candidates.length === 0) return []

  const ignored = await listIgnored(root, candidates)
  if (ignored.size === 0) return candidates

  return candidates.filter((path) => !ignored.has(path))
}

async function listIgnored(
  root: string,
  candidates: string[],
): Promise<Set<string>> {
  const isRepo = await $`git -C ${root} rev-parse --git-dir`
    .quiet()
    .nothrow()
    .then((result) => result.exitCode === 0)

  if (!isRepo) return new Set()

  const stdin = Buffer.from(`${candidates.join('\n')}\n`)

  // check-ignore exits 1 when nothing matches, which is not an error here.
  const result = await $`git -C ${root} check-ignore --stdin < ${stdin}`
    .quiet()
    .nothrow()

  if (result.exitCode > 1) return new Set()

  return new Set(
    result
      .text()
      .split('\n')
      .filter(Boolean)
      .map((path) => resolve(root, path)),
  )
}

/**
 * Walks up from `path` to the nearest folder holding an index, stopping at
 * `root`. Returns undefined when the path escapes the boundary or nothing
 * indexed is found.
 */
export function findIndexedAncestor(
  path: string,
  root: string,
): string | undefined {
  if (!existsSync(path)) return undefined

  const rootAbs = resolve(root)
  let dir = statSync(path).isDirectory()
    ? resolve(path)
    : dirname(resolve(path))

  while (dir === rootAbs || dir.startsWith(`${rootAbs}/`)) {
    if (existsSync(`${dir}/${INDEX_FILE}`)) return dir
    if (dir === rootAbs) return undefined
    dir = dirname(dir)
  }

  return undefined
}

export { INDEX_FILE, PRUNED }
