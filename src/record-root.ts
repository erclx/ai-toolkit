import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The roots a session record folder is read at, in precedence order.
 *
 * `.canon/` wins because a tree that carries it has been migrated, and reading
 * `.claude/` there would answer from the copy the move left behind. A tree that
 * carries neither is every tree today, which is what keeps this branch a no-op
 * until the move lands.
 *
 * The shape is `readStamp`'s: order the spellings, take the first that exists,
 * and stand the creation default in when none does.
 */
export const RECORD_ROOTS = ['.canon', '.claude'] as const

export type RecordRoot = (typeof RECORD_ROOTS)[number]

/**
 * The root a record folder is created at.
 *
 * It disagrees with the read precedence above on purpose, and the disagreement
 * is the whole of this branch. Creating under `.canon/` before the move would
 * write records to a root whose ignore line may not have reached a target yet,
 * and it would split one project's records across two roots with no verb able
 * to reconcile them. The move flips this line and nothing else.
 */
export const CREATION_ROOT: RecordRoot = '.claude'

/**
 * The deletable scratch folder, named at the spelling `.claude/` gives it.
 *
 * It is the one folder whose name differs by root. Inside a dotted root the
 * leading dot hides nothing already hidden and costs a bare `ls` that omits the
 * folder, so the move drops it. Every other record folder keeps its name,
 * `.records.git` included, where the dot marks the mechanism apart from a
 * payload rather than hiding it.
 */
export const SCRATCH = '.tmp'

/** The scratch folder's name under `.canon/`. */
const CANON_SCRATCH = 'tmp'

/** How a root spells a folder name. Only the scratch folder differs. */
function spell(root: RecordRoot, folder: string): string {
  return root === '.canon' && folder === SCRATCH ? CANON_SCRATCH : folder
}

/**
 * The root a folder resolves at: the first that carries it, and the creation
 * default when neither does.
 *
 * Presence is read on the record folder itself rather than on the full path, so
 * an archive or a payload that does not exist yet still resolves beside the
 * records it belongs to rather than at the creation default.
 */
function rootOf(root: string, folder: string): RecordRoot {
  return (
    RECORD_ROOTS.find((candidate) =>
      existsSync(join(root, candidate, spell(candidate, folder))),
    ) ?? CREATION_ROOT
  )
}

/**
 * Where a record folder is read.
 *
 * `folder` is the record folder itself and `rest` is whatever sits inside it,
 * so a caller spells no root and no folder-name variant of its own. A caller
 * that spells `.claude` by hand is the one thing the move has to find, and one
 * that calls this is one the move never has to open again.
 */
export function recordDir(
  root: string,
  folder: string,
  ...rest: string[]
): string {
  const at = rootOf(root, folder)

  return join(root, at, spell(at, folder), ...rest)
}

/**
 * Every root a record folder would be read at, in precedence order, whether or
 * not it is on disk.
 *
 * Containment tests take this rather than `recordDir`, since a path written
 * against the root a tree no longer uses is still a path into that folder and
 * reading it as outside would report a shipped plan as still live.
 */
export function recordDirs(
  root: string,
  folder: string,
  ...rest: string[]
): string[] {
  return RECORD_ROOTS.map((candidate) =>
    join(root, candidate, spell(candidate, folder), ...rest),
  )
}

/** Where a record folder is created, which is the creation default always. */
export function creationDir(
  root: string,
  folder: string,
  ...rest: string[]
): string {
  return join(root, CREATION_ROOT, spell(CREATION_ROOT, folder), ...rest)
}

/**
 * The creation destination relative to the project root, which is the form a
 * message displays and an option default carries.
 */
export function creationRel(folder: string, ...rest: string[]): string {
  return join(CREATION_ROOT, spell(CREATION_ROOT, folder), ...rest)
}

/**
 * The record root itself, for a caller whose subject is the root rather than a
 * folder inside it.
 *
 * A half-migrated tree resolves here on the root that exists rather than on the
 * folders under it, which is what makes the backup history and its work tree
 * one answer. Splitting them would let a push resolve a history at one root and
 * stage a work tree at the other, which stages the deletion of every folder the
 * move relocated.
 */
export function recordRoot(root: string): string {
  return join(
    root,
    RECORD_ROOTS.find((candidate) => existsSync(join(root, candidate))) ??
      CREATION_ROOT,
  )
}
