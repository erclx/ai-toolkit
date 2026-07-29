import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface GovStack {
  readonly name: string
  readonly parent?: string
  readonly rules: readonly string[]
}

export type RuleResolution =
  | { readonly ok: true; readonly rules: string[] }
  | { readonly ok: false; readonly missingStack: string }

function stacksDir(root: string): string {
  return join(root, 'governance', 'stacks')
}

export function govStackPath(root: string, stack: string): string {
  return join(stacksDir(root), `${stack}.toml`)
}

export function govStackExists(root: string, stack: string): boolean {
  return existsSync(govStackPath(root, stack))
}

/**
 * Lists stack names the way `find -name "*.toml" -exec basename {} .toml` did.
 */
export function listGovStacks(root: string): string[] {
  const dir = stacksDir(root)
  if (!existsSync(dir)) return []

  return [...new Bun.Glob('*.toml').scanSync({ cwd: dir, onlyFiles: true })]
    .map((entry) => entry.slice(0, -'.toml'.length))
    .sort()
}

/**
 * Reads one stack file. `Bun.TOML.parse` replaces a `BASH_REMATCH` loop that
 * consumed each rules line with `sed` as it walked, which is the hand-rolled
 * parser shape the tooling manifest already moved off.
 */
export function loadGovStack(
  root: string,
  stack: string,
): GovStack | undefined {
  const path = govStackPath(root, stack)
  if (!existsSync(path)) return undefined

  const parsed = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<
    string,
    unknown
  >
  const parent = typeof parsed.extends === 'string' ? parsed.extends : ''

  return {
    name: stack,
    parent: parent === '' ? undefined : parent,
    rules: Array.isArray(parsed.rules)
      ? parsed.rules.filter(
          (rule): rule is string => typeof rule === 'string' && rule !== '',
        )
      : [],
  }
}

/**
 * Walks `extends` ancestors first, then the stack's own rules, deduped by
 * first appearance. Tooling's `resolveChain` returns full manifests nearest
 * first and carries `skipStack` truncation, so the two walks stay separate
 * rather than fitting one shape to both.
 */
export function resolveRules(root: string, stack: string): RuleResolution {
  const rules: string[] = []
  const seen = new Set<string>()
  const visited = new Set<string>()

  const walk = (current: string): string | undefined => {
    if (visited.has(current)) return undefined
    visited.add(current)

    const loaded = loadGovStack(root, current)
    if (!loaded) return current

    if (loaded.parent !== undefined) {
      const missing = walk(loaded.parent)
      if (missing !== undefined) return missing
    }

    for (const rule of loaded.rules) {
      if (seen.has(rule)) continue
      seen.add(rule)
      rules.push(rule)
    }

    return undefined
  }

  const missingStack = walk(stack)
  if (missingStack !== undefined) return { ok: false, missingStack }

  return { ok: true, rules }
}

/**
 * Layers `--add` names on top of a resolved stack. The bash trimmed a single
 * leading and trailing space per entry; trimming fully is the same result for
 * every input that parsed before.
 */
export function mergeExtraRules(
  rules: readonly string[],
  add: string,
): string[] {
  const merged = [...rules]

  for (const raw of add.split(',')) {
    const extra = raw.trim()
    if (extra === '') continue
    if (merged.includes(extra)) continue
    merged.push(extra)
  }

  return merged
}
