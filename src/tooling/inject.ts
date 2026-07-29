import { existsSync } from 'node:fs'
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { $ } from 'bun'
import { copyPreservingMode } from '@/copy'
import { mergeSections, pruneSections } from '@/tooling/gitignore'
import { ancestorsFirst, listFiles, type Manifest } from '@/tooling/manifest'
import {
  applyScripts,
  collectDeps,
  readPackage,
  serializePackage,
} from '@/tooling/package'
import { logAdd, logRemove, logStep } from '@/ui'

export async function injectConfigs(
  chain: readonly Manifest[],
  target: string,
): Promise<string[]> {
  const applied: string[] = []

  for (const manifest of ancestorsFirst(chain)) {
    const files = listFiles(manifest.configsDir)
    if (files.length === 0) continue

    logStep(`Applying ${manifest.name} configs`)
    for (const rel of files) {
      await copyPreservingMode(
        join(manifest.configsDir, rel),
        join(target, rel),
      )
      logAdd(rel)
      applied.push(rel)
    }
  }

  return applied
}

/**
 * Copies a seed when the target lacks it. When the target already has one and
 * the seed is a `.txt` word list, missing lines are appended and the file is
 * re-sorted. Every other existing file is left untouched.
 */
async function mergeSeedFile(src: string, dest: string): Promise<void> {
  await mkdir(dirname(dest), { recursive: true })

  if (!existsSync(dest)) {
    await copyFile(src, dest)
    return
  }

  if (!src.endsWith('.txt')) return

  const existing = (await readFile(dest, 'utf8')).split('\n')
  const incoming = (await readFile(src, 'utf8')).split('\n')
  const missing = incoming.filter(
    (word) => word !== '' && !existing.includes(word),
  )

  if (missing.length === 0) return

  const merged = [...existing.filter((line) => line !== ''), ...missing].sort()
  await writeFile(dest, `${merged.join('\n')}\n`)
}

export async function injectSeeds(
  chain: readonly Manifest[],
  target: string,
): Promise<string[]> {
  const applied: string[] = []

  for (const manifest of ancestorsFirst(chain)) {
    const files = listFiles(manifest.seedsDir)
    if (files.length === 0) continue

    logStep(`Applying ${manifest.name} seeds`)
    for (const rel of files) {
      await mergeSeedFile(join(manifest.seedsDir, rel), join(target, rel))
      logAdd(rel)
      applied.push(rel)
    }
  }

  return applied
}

export async function injectGitignore(
  chain: readonly Manifest[],
  target: string,
): Promise<string[]> {
  const path = join(target, '.gitignore')
  const added: string[] = []

  for (const manifest of ancestorsFirst(chain)) {
    if (manifest.gitignore.length === 0) continue

    const content = existsSync(path) ? await readFile(path, 'utf8') : ''
    const result = mergeSections(content, manifest.gitignore)
    if (result.added.length === 0) continue

    logStep(`Applying ${manifest.name} gitignore`)
    await writeFile(path, result.content)
    for (const entry of result.added) {
      logAdd(entry)
      added.push(entry)
    }
  }

  if (added.length === 0 && !existsSync(path)) await writeFile(path, '')

  return added
}

export async function pruneGitignore(
  chain: readonly Manifest[],
  target: string,
): Promise<string[]> {
  const path = join(target, '.gitignore')
  if (!existsSync(path)) return []

  const removed: string[] = []

  for (const manifest of ancestorsFirst(chain)) {
    if (manifest.gitignore.length === 0) continue

    const content = await readFile(path, 'utf8')
    const result = pruneSections(content, manifest.gitignore)
    if (result.removed.length === 0) continue

    await writeFile(path, result.content)
    for (const entry of result.removed) {
      logRemove(entry)
      removed.push(entry)
    }
  }

  return removed
}

/**
 * Installs missing dev dependencies, fills package scripts, and merges
 * gitignore entries. This is the `inject_tooling_manifest` sequence, which
 * assumed a target that already has a package.json.
 */
export async function injectManifest(
  chain: readonly Manifest[],
  target: string,
): Promise<void> {
  const packagePath = join(target, 'package.json')
  const pkg = readPackage(packagePath)

  if (pkg) {
    const missing = collectDeps(chain, pkg)
      .filter((dep) => dep.state === 'missing')
      .map((dep) => dep.spec)

    if (missing.length > 0) {
      logStep('Installing missing dependencies')
      await $`bun add -D ${missing}`.cwd(target)
      for (const spec of missing) logAdd(spec)
    }

    const fresh = readPackage(packagePath)
    if (fresh) {
      const result = applyScripts(fresh, chain)
      if (result.added.length > 0 || result.overridden.length > 0) {
        logStep('Applying scripts')
        for (const key of result.added) logAdd(key)
        for (const key of result.overridden) logAdd(key)
        await writeFile(packagePath, serializePackage(result.pkg))
      }
    }
  }

  await injectGitignore(chain, target)
}

/**
 * Drops reference docs into `.claude/tooling/`, clearing the legacy
 * `tooling/` location the earlier layout used.
 */
export async function applyReferences(
  chain: readonly Manifest[],
  target: string,
  stacks: readonly string[],
): Promise<string[]> {
  const destDir = join(target, '.claude', 'tooling')
  await mkdir(destDir, { recursive: true })

  const applied: string[] = []
  const byName = new Map(chain.map((manifest) => [manifest.name, manifest]))

  for (const stack of stacks) {
    const manifest = byName.get(stack)
    if (!manifest) continue

    await copyFile(manifest.referenceFile, join(destDir, `${stack}.md`))
    logAdd(`.claude/tooling/${stack}.md`)
    applied.push(stack)
    await rm(join(target, 'tooling', `${stack}.md`), { force: true })
  }

  await rmdir(join(target, 'tooling')).catch(() => {})

  return applied
}
