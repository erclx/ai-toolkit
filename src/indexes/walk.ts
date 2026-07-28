import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { $ } from 'bun'

const INDEX_FILE = 'index.md'

const PRUNED_SEGMENTS = ['node_modules', '.git']

function isPruned(relativePath: string): boolean {
  return relativePath
    .split('/')
    .some((segment) => PRUNED_SEGMENTS.includes(segment))
}

/**
 * Lists every folder index under `root`.
 *
 * Vendored and git trees are pruned by path segment, since `Bun.Glob` has no
 * exclude. Everything else is dropped via `git check-ignore`, so a project's
 * own `.gitignore` governs what the walker sees. Outside a git repo the
 * segment prune is the only filter that applies.
 */
export async function listIndexes(root: string): Promise<string[]> {
  const glob = new Bun.Glob(`**/${INDEX_FILE}`)
  const candidates: string[] = []

  for await (const rel of glob.scan({
    cwd: root,
    onlyFiles: true,
    dot: true,
  })) {
    if (isPruned(rel)) continue
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

export { INDEX_FILE, PRUNED_SEGMENTS }
