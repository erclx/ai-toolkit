import { existsSync, readFileSync } from 'node:fs'
import type { Manifest } from '@/tooling/manifest'

export interface PackageJson {
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly scripts?: Record<string, string>
  readonly [key: string]: unknown
}

export interface ScriptState {
  readonly key: string
  readonly state: 'missing' | 'drifted' | 'matching'
}

export interface DepState {
  readonly spec: string
  readonly name: string
  readonly state: 'missing' | 'present'
}

export function readPackage(path: string): PackageJson | undefined {
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as PackageJson
  } catch {
    return undefined
  }
}

export function serializePackage(pkg: PackageJson): string {
  return `${JSON.stringify(pkg, null, 2)}\n`
}

/**
 * Splits a dependency spec into its package name, handling the scoped case
 * where the leading `@` is part of the name rather than a version separator.
 * `@scope/pkg@^1.2.3` yields `@scope/pkg`, `react@19` yields `react`.
 */
export function parseSpec(spec: string): { name: string; pin: string } {
  let name = spec

  if (spec.startsWith('@')) {
    const rest = spec.slice(1)
    if (rest.includes('@')) name = `@${rest.slice(0, rest.indexOf('@'))}`
  } else {
    name = spec.split('@')[0]
  }

  const pin = spec === name ? '' : spec.slice(name.length + 1)
  return { name, pin }
}

function firstInteger(value: string): string | undefined {
  return value.match(/[0-9]+/)?.[0]
}

/**
 * Compares a manifest pin against what package.json records. A spec counts as
 * missing when absent, or when the pinned major differs from the installed
 * major. Anything looser than a major mismatch is left alone.
 */
function isSatisfied(installed: string | undefined, pin: string): boolean {
  if (installed === undefined) return false
  if (pin === '') return true

  const pinMajor = firstInteger(pin)
  const installedMajor = firstInteger(installed)
  if (pinMajor === undefined) return true

  return pinMajor === installedMajor
}

/**
 * Resolves dev dependencies across the chain, ancestors first, deduplicated by
 * package name so the outermost stack that names a package wins.
 */
export function collectDeps(
  chain: readonly Manifest[],
  pkg: PackageJson,
): DepState[] {
  const installed = { ...pkg.dependencies, ...pkg.devDependencies }
  const seen = new Set<string>()
  const states: DepState[] = []

  for (const manifest of [...chain].reverse()) {
    for (const spec of manifest.devPackages) {
      const { name, pin } = parseSpec(spec)
      if (name === '' || seen.has(name)) continue
      seen.add(name)

      states.push({
        spec,
        name,
        state: isSatisfied(installed[name], pin) ? 'present' : 'missing',
      })
    }
  }

  return states
}

/**
 * Compares manifest scripts against package.json, nearest stack first, so a
 * child definition shadows the parent it extends.
 */
export function collectScripts(
  chain: readonly Manifest[],
  pkg: PackageJson,
): ScriptState[] {
  const scripts = pkg.scripts ?? {}
  const seen = new Set<string>()
  const states: ScriptState[] = []

  for (const manifest of chain) {
    for (const [key, value] of Object.entries(manifest.scripts)) {
      if (seen.has(key)) continue
      seen.add(key)

      const current = scripts[key]
      if (current === undefined) {
        states.push({ key, state: 'missing' })
      } else if (current !== value) {
        states.push({ key, state: 'drifted' })
      } else {
        states.push({ key, state: 'matching' })
      }
    }
  }

  return states
}

/**
 * Fills scripts the target does not define, nearest stack first, then replays
 * `[scripts.override]` from the furthest ancestor inward so the nearest stack
 * has the last word. This is the ordering `apply_stack_scripts` produced
 * through its recursion.
 */
export function applyScripts(
  pkg: PackageJson,
  chain: readonly Manifest[],
): { pkg: PackageJson; added: string[]; overridden: string[] } {
  const scripts: Record<string, string> = { ...pkg.scripts }
  const added: string[] = []
  const overridden: string[] = []

  for (const manifest of chain) {
    for (const [key, value] of Object.entries(manifest.scripts)) {
      if (scripts[key] === undefined) {
        scripts[key] = value
        added.push(key)
      }
    }
  }

  for (const manifest of [...chain].reverse()) {
    for (const [key, value] of Object.entries(manifest.scriptOverrides)) {
      if (scripts[key] === value) continue
      scripts[key] = value
      if (!overridden.includes(key)) overridden.push(key)
    }
  }

  return { pkg: { ...pkg, scripts }, added, overridden }
}
