import { existsSync } from 'node:fs'
import { chmod } from 'node:fs/promises'
import { join } from 'node:path'
import { copyPreservingMode } from '@/copy'

const SEEDS_DIR = join('tooling', 'claude', 'seeds')
const CLAUDE_DIR = '.claude'
const CLAUDE_MD = 'CLAUDE.md'
const HOOKS = 'hooks'
const SUBDIRS: readonly string[] = [HOOKS, 'context', 'wireframes']

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
    for (const name of listLevel(join(source, subdir))) {
      const rel = `${subdir}/${name}`
      seeds.push({
        src: join(source, subdir, name),
        dest: join(destDir, subdir, name),
        scanLabel: rel,
        applyLabel: join(CLAUDE_DIR, subdir, name),
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
 */
export async function applySeeds(seeds: readonly Seed[]): Promise<string[]> {
  const applied: string[] = []

  for (const seed of seeds) {
    await copyPreservingMode(seed.src, seed.dest)
    if (seed.executable) await chmod(seed.dest, 0o755)
    applied.push(seed.applyLabel)
  }

  return applied
}
