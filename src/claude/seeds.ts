import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { copyPreservingMode } from '@/copy'
import { creationRel, isRecordEntry } from '@/record-root'
import { rewritesOnInstall, stripSeedMarker } from '@/seed-marker'

const SEEDS_DIR = join('tooling', 'claude', 'seeds')
const CLAUDE_DIR = '.claude'
const CLAUDE_MD = 'CLAUDE.md'
const HOOKS = 'hooks'
/**
 * Seed subdirectories under `.claude/`. Exported because each one replaced a
 * single file of the same stem in an older layout, which is what
 * `@/sync/layout` pairs a target against to find a superseded artifact.
 */
export const SUBDIRS: readonly string[] = [
  HOOKS,
  'context',
  'diagrams',
  'memory',
  'tasks',
  'wireframes',
]

export type SeedScope = 'claude' | 'root'

export interface Seed {
  readonly src: string
  readonly dest: string
  readonly scanLabel: string
  readonly applyLabel: string
  readonly scope: SeedScope
  readonly executable: boolean
}

export interface SeedEntry {
  readonly seed: Seed
  readonly present: boolean
}

export interface SeedCounts {
  readonly claude: number
  readonly root: number
}

function seedsRoot(root: string): string {
  return join(root, SEEDS_DIR)
}

/**
 * Lists a single directory level, sorted the way `find -maxdepth 1 -type f |
 * sort` was. Bun.Glob skips dotfiles without `dot`, and every path here sits
 * under `.claude`, so omitting it would match nothing.
 */
function listLevel(dir: string): string[] {
  if (!existsSync(dir)) return []
  return [
    ...new Bun.Glob('*').scanSync({ cwd: dir, onlyFiles: true, dot: true }),
  ].sort()
}

/**
 * Builds the seed list in the order the bash scanned it: the `.claude` root
 * level, then each subdirectory, then the project-level `CLAUDE.md`. Order is
 * load-bearing because it is also the order the timeline prints.
 */
export function planSeeds(root: string, target: string): SeedEntry[] {
  const source = join(seedsRoot(root), CLAUDE_DIR)
  const destDir = join(target, CLAUDE_DIR)
  const seeds: Seed[] = []

  for (const name of listLevel(source)) {
    seeds.push({
      src: join(source, name),
      dest: join(destDir, name),
      scanLabel: name,
      applyLabel: join(CLAUDE_DIR, name),
      scope: 'claude',
      executable: false,
    })
  }

  for (const subdir of SUBDIRS) {
    // The seed tree authors every subdirectory under `.claude/`, and three of
    // them are record folders that install under the record root instead. A
    // target that has not migrated resolves back to `.claude/`, so the same seed
    // lands beside the records already there rather than opening a second root.
    // Scaffolding one under `.claude/` now would also land it outside the single
    // `.canon/` ignore entry a target receives, which tracks the memory pen.
    const installRel = isRecordEntry(subdir)
      ? creationRel(target, subdir)
      : join(CLAUDE_DIR, subdir)

    for (const name of listLevel(join(source, subdir))) {
      const rel = `${subdir}/${name}`
      seeds.push({
        src: join(source, subdir, name),
        dest: join(target, installRel, name),
        scanLabel: rel,
        applyLabel: join(installRel, name),
        scope: 'claude',
        executable: subdir === HOOKS,
      })
    }
  }

  const claudeMd = join(seedsRoot(root), CLAUDE_MD)
  if (existsSync(claudeMd)) {
    seeds.push({
      src: claudeMd,
      dest: join(target, CLAUDE_MD),
      scanLabel: CLAUDE_MD,
      applyLabel: CLAUDE_MD,
      scope: 'root',
      executable: false,
    })
  }

  return seeds.map((seed) => ({ seed, present: existsSync(seed.dest) }))
}

export function pendingSeeds(entries: readonly SeedEntry[]): Seed[] {
  return entries.filter((entry) => !entry.present).map((entry) => entry.seed)
}

export function countByScope(seeds: readonly Seed[]): SeedCounts {
  return {
    claude: seeds.filter((seed) => seed.scope === 'claude').length,
    root: seeds.filter((seed) => seed.scope === 'root').length,
  }
}

/**
 * Copies each pending seed. Hooks get the executable bit the way `chmod +x`
 * granted it, added on top of whatever mode the destination already carried.
 *
 * A markdown seed is rewritten rather than copied, so the stub marker the seed
 * gate reads does not reach the target. Every other seed copies byte for byte,
 * which is what keeps the hook scripts and `settings.json` untouched.
 */
export async function applySeeds(seeds: readonly Seed[]): Promise<string[]> {
  const applied: string[] = []

  for (const seed of seeds) {
    if (rewritesOnInstall(seed.src)) {
      await mkdir(dirname(seed.dest), { recursive: true })
      await writeFile(
        seed.dest,
        stripSeedMarker(await readFile(seed.src, 'utf8')),
      )
    } else {
      await copyPreservingMode(seed.src, seed.dest)
    }

    if (seed.executable) await chmod(seed.dest, 0o755)
    applied.push(seed.applyLabel)
  }

  return applied
}
