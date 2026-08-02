import { existsSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { INDEX_FILE, listIndexes } from '@/indexes/walk'

/**
 * Folder names under `.claude/` audited by default.
 *
 * The index-plus-entry contract on its own over-collects. `.claude/standards/`
 * also carries a generated index beside entries with frontmatter, and auditing
 * it would measure the consumed copy of `standards/` against a rule written for
 * per-domain narrative. This list names the folders `standards/context.md`
 * governs, and `--folder` admits another without an edit here.
 */
export const DEFAULT_FOLDERS: readonly string[] = [
  'context',
  'diagrams',
  'wireframes',
]

export interface AuditedFolder {
  /** Repo-relative folder path, used verbatim in every report line. */
  readonly rel: string
  readonly indexPath: string
  /** Absolute paths of the folder's own entries, excluding its `index.md`. */
  readonly entries: readonly string[]
}

/**
 * Names the requested folders that actually exist, which is the citation
 * check's scope.
 *
 * A skill or seed pointing into `.claude/wireframes/` is a live instruction for
 * a project that carries the folder and says nothing about one that does not.
 * Checking a path into an absent folder would fail eight shipped references
 * here for the sole reason that this repository has no wireframes.
 */
export function presentNames(folders: readonly AuditedFolder[]): string[] {
  return [...new Set(folders.map((folder) => folder.rel.split('/')[1]))]
}

async function readEntries(dir: string): Promise<string[]> {
  const paths: string[] = []

  for await (const name of new Bun.Glob('*.md').scan({
    cwd: dir,
    onlyFiles: true,
    dot: true,
  })) {
    if (name === INDEX_FILE) continue
    paths.push(resolve(dir, name))
  }

  return paths.sort()
}

/**
 * Resolves the folders to audit under `root`.
 *
 * A named folder contributes its own entries plus those of every nested index
 * folder beneath it, so a domain that outgrew one file and split is audited at
 * the same grain as one that did not. Discovery of the nested folders runs
 * through the shared walker, which is what keeps `.gitignore` and the vendored
 * prune governing this scan as well as index regeneration.
 *
 * A requested folder that does not exist is dropped rather than reported. The
 * default list names three folders and a project carrying one of them is the
 * ordinary case.
 */
export async function resolveFolders(
  root: string,
  names: readonly string[] = DEFAULT_FOLDERS,
): Promise<AuditedFolder[]> {
  const folders: AuditedFolder[] = []

  for (const name of names) {
    const dir = resolve(root, '.claude', name)
    if (!existsSync(`${dir}/${INDEX_FILE}`)) continue

    const dirs = [dir, ...(await listIndexes(dir)).map(dirname)]

    for (const each of [...new Set(dirs)].sort()) {
      folders.push({
        rel: relative(root, each),
        indexPath: `${each}/${INDEX_FILE}`,
        entries: await readEntries(each),
      })
    }
  }

  return folders
}
