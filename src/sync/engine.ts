import { existsSync, readFileSync, statSync } from 'node:fs'
import { copyFile, mkdir, rm } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import {
  intro,
  logAdd,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
  select,
} from '@/ui'

const GREEN = '\x1b[0;32m'
const NC = '\x1b[0m'

export interface InstalledFile {
  /** Absolute path of the file as installed in the target. */
  readonly path: string
  /** Path relative to the domain's installed root, e.g. `core/000-x.md`. */
  readonly relToRoot: string
  /** Path relative to the target, used for every log line. */
  readonly rel: string
}

export interface RetiredSurface {
  readonly path: string
  readonly rel: string
  readonly notice: string
}

export type SyncChange =
  | {
      readonly kind: 'copy'
      readonly source: string
      readonly dest: string
      readonly rel: string
    }
  | { readonly kind: 'delete'; readonly dest: string; readonly rel: string }

export type EntryState = 'matching' | 'drifted' | 'orphaned'

export interface ScanEntry {
  readonly state: EntryState
  readonly rel: string
}

export interface SyncPlan {
  readonly entries: readonly ScanEntry[]
  readonly retired: readonly RetiredSurface[]
  readonly changes: readonly SyncChange[]
}

/**
 * The two holes every domain sync leaves open: where a destination file's
 * source lives, and what counts as a change beyond a plain content diff.
 * Everything else in a sync is identical across gov, snippets, and standards,
 * so it lives in the engine.
 */
export interface SyncAdapter {
  /** Frame banner, e.g. `aitk gov sync`. */
  readonly banner: string
  /** Scan section header, rendered as `Scanning <label>`. */
  readonly label: string
  /** Shown when the target has nothing installed for this domain. */
  readonly missingMessage: string
  /** Noun for the completion line, e.g. `changes`. */
  readonly unit: string
  /** Directory in the target holding installed files. */
  installedRoot(target: string): string
  /** Resolves the toolkit source for one installed file. */
  locateSource(file: InstalledFile): string | undefined
  /** Surfaces the walk cannot see, such as retired files scheduled for removal. */
  collectRetired?(target: string): RetiredSurface[]
}

/**
 * Lists installed markdown, dotfiles included. `Bun.Glob` skips entries
 * beginning with a dot unless `dot` is set, and every domain installs under
 * `.claude/`, so a nested dot-directory would silently drop out of the walk.
 */
export function listInstalled(root: string, target: string): InstalledFile[] {
  if (!existsSync(root)) return []

  return [
    ...new Bun.Glob('**/*.md').scanSync({
      cwd: root,
      onlyFiles: true,
      dot: true,
    }),
  ]
    .sort()
    .map((relToRoot) => {
      const path = resolve(root, relToRoot)
      return { path, relToRoot, rel: relative(target, path) }
    })
}

/**
 * Classifies every installed file against its source without writing anything.
 * A file with no source is left alone rather than deleted, which is what keeps
 * project-authored rules alive across a sync.
 */
export function planSync(adapter: SyncAdapter, target: string): SyncPlan {
  const entries: ScanEntry[] = []
  const changes: SyncChange[] = []

  for (const file of listInstalled(adapter.installedRoot(target), target)) {
    const source = adapter.locateSource(file)

    if (source === undefined || !existsSync(source)) {
      entries.push({ state: 'orphaned', rel: file.rel })
      continue
    }

    if (sameContent(source, file.path)) {
      entries.push({ state: 'matching', rel: file.rel })
      continue
    }

    entries.push({ state: 'drifted', rel: file.rel })
    changes.push({
      kind: 'copy',
      source,
      dest: file.path,
      rel: file.rel,
    })
  }

  const retired = adapter.collectRetired?.(target) ?? []
  for (const surface of retired) {
    changes.push({ kind: 'delete', dest: surface.path, rel: surface.rel })
  }

  return { entries, retired, changes }
}

export async function applyChanges(
  changes: readonly SyncChange[],
): Promise<void> {
  logStep('Applying changes')

  for (const change of changes) {
    if (change.kind === 'copy') {
      await mkdir(dirname(change.dest), { recursive: true })
      await copyFile(change.source, change.dest)
      logAdd(change.rel)
      continue
    }

    await rm(change.dest, { force: true })
    logWarn(`removed ${change.rel}`)
  }
}

export interface SyncRunOptions {
  /** Path the sync refuses to run against, normally the toolkit root. */
  readonly protectedRoot: string
}

/**
 * Runs one domain sync end to end and returns the process exit code. Callers
 * register a command, build an adapter, and hand both to this function.
 */
export async function runDomainSync(
  adapter: SyncAdapter,
  target: string,
  options: SyncRunOptions,
): Promise<number> {
  intro(adapter.banner)

  const resolved = resolve(target)

  if (!isDirectory(resolved)) {
    logError(`Target directory not found: ${target}`)
    outro()
    return 1
  }

  if (resolved === options.protectedRoot) {
    logError(
      'Cannot run against toolkit root. Files here are the source of truth.',
    )
    outro()
    return 1
  }

  const plan = planSync(adapter, resolved)

  if (
    !existsSync(adapter.installedRoot(resolved)) &&
    plan.retired.length === 0
  ) {
    logWarn(adapter.missingMessage)
    outro()
    return 0
  }

  report(adapter, plan)

  const count = plan.changes.length
  if (count === 0) {
    outro()
    process.stderr.write(`${GREEN}✓ Everything up to date${NC}\n`)
    return 0
  }

  const shouldApply = await select({
    message: `Apply ${count} changes?`,
    options: [
      { value: true, label: 'Apply all' },
      { value: false, label: 'Cancel' },
    ],
    nonInteractiveDefault: true,
  })

  if (!shouldApply) {
    logWarn('Sync cancelled')
    outro()
    return 0
  }

  await applyChanges(plan.changes)

  outro()
  process.stderr.write(
    `${GREEN}✓ Sync complete${NC} \x1b[0;90m(${count} ${adapter.unit})${NC}\n`,
  )
  return 0
}

/**
 * Reports in walk order rather than grouped by state, so a long rule tree
 * reads as a directory listing with drift called out in place.
 */
function report(adapter: SyncAdapter, plan: SyncPlan): void {
  logStep(`Scanning ${adapter.label}`)

  for (const entry of plan.entries) {
    if (entry.state === 'matching') logInfo(entry.rel)
    else if (entry.state === 'drifted') logWarn(entry.rel)
    else logWarn(`${entry.rel} (not in toolkit source, skipping)`)
  }

  for (const surface of plan.retired) {
    logWarn(surface.notice)
  }
}

function sameContent(left: string, right: string): boolean {
  return readFileSync(left).equals(readFileSync(right))
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}
