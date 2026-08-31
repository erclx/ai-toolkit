import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

/**
 * One project the toolkit has installed into, as the install recorded it.
 *
 * The path is the target root rather than its git directory, because the
 * record is written by a sync that knows where it wrote and not by anything
 * that resolved a repository. Whether two entries are one project is a
 * question about their origins, which `src/targets/sweep.ts` answers.
 */
export interface TargetRecord {
  readonly path: string
  /** ISO stamp of the most recent sync that recorded this target. */
  readonly stampedAt: string
}

/**
 * An absent file and an empty one are separate answers, the same split
 * `src/sessions/registry.ts` draws.
 *
 * The first means no sync has ever recorded a target on this machine, so the
 * population is unknown and the sweep is the only reading available. The
 * second means the file was read and holds no usable row, which a caller
 * should be able to tell apart from a lookup that never ran.
 */
export type TargetRegistry =
  | { readonly kind: 'absent'; readonly path: string }
  | {
      readonly kind: 'read'
      readonly path: string
      readonly targets: readonly TargetRecord[]
    }

interface StoredRegistry {
  readonly version: number
  readonly targets: readonly TargetRecord[]
}

const VERSION = 1

/**
 * Resolves the folder holding this machine's toolkit state.
 *
 * Twin of `sandboxTree` in `src/commands/sandbox.ts`, which resolves the same
 * three sources in the same order. The override exists so a test never writes
 * into the home directory of whoever runs it.
 */
export function stateDir(): string {
  const override = process.env.CANON_STATE_DIR
  if (override !== undefined && override !== '') return override

  const state = process.env.XDG_STATE_HOME
  const base =
    state !== undefined && state !== ''
      ? state
      : join(homedir(), '.local', 'state')

  return join(base, 'canon')
}

export function registryPath(): string {
  return join(stateDir(), 'targets.json')
}

function isRecord(value: Partial<TargetRecord>): value is TargetRecord {
  return (
    typeof value.path === 'string' &&
    value.path.length > 0 &&
    typeof value.stampedAt === 'string' &&
    value.stampedAt.length > 0
  )
}

/**
 * Reads every recorded target, sorted by path.
 *
 * A row missing either field is dropped rather than reported. This module is
 * the file's only writer, so a malformed row is a hand edit or a truncated
 * write and neither is a finding the caller can act on. What a caller can act
 * on is the file being absent, which is its own kind above.
 */
export function readTargetRegistry(
  path: string = registryPath(),
): TargetRegistry {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return { kind: 'absent', path }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { kind: 'read', path, targets: [] }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { kind: 'read', path, targets: [] }
  }

  const stored = parsed as Partial<StoredRegistry>
  const rows = Array.isArray(stored.targets) ? stored.targets : []
  const targets = rows
    .filter((row): row is TargetRecord =>
      isRecord(row as Partial<TargetRecord>),
    )
    .sort((a, b) => a.path.localeCompare(b.path))

  return { kind: 'read', path, targets }
}

/** Why a record attempt did not land, so a caller can say so rather than assume it did. */
export type RecordOutcome = 'recorded' | 'unwritten'

/**
 * Records one target, keyed by its resolved path and replacing any row already
 * held for it.
 *
 * The write is a temp file plus a rename, so a reader never meets a half
 * written file. Two syncs finishing together still resolve last-writer-wins on
 * the merged set, which can drop the row the loser added. That is left rather
 * than locked: the authoritative record of an install is the stamp inside the
 * target, this index is a cache over those, and the next sync of the dropped
 * target restores its row.
 *
 * Nothing removes a row either, so a target that was deleted or that dropped
 * the toolkit stays here and the count drifts upward. `canon targets pulls`
 * meets that on use, since it refuses a path it cannot open rather than
 * reading it as a target with no work, but `canon targets list` does not: it
 * never opens a recorded path, and the count is its whole output.
 */
export function recordTarget(
  target: string,
  now: Date,
  path: string = registryPath(),
): RecordOutcome {
  const resolved = resolve(target)
  const current = readTargetRegistry(path)
  const existing = current.kind === 'read' ? current.targets : []

  const targets = [
    ...existing.filter((row) => row.path !== resolved),
    { path: resolved, stampedAt: now.toISOString() },
  ].sort((a, b) => a.path.localeCompare(b.path))

  const payload: StoredRegistry = { version: VERSION, targets }
  const temp = `${path}.${process.pid}.tmp`

  try {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`)
    renameSync(temp, path)
    return 'recorded'
  } catch {
    return 'unwritten'
  }
}
