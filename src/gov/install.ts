import { existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { copyPreservingMode } from '@/copy'

export interface RuleSource {
  readonly rule: string
  readonly src: string
  readonly subdir: string
}

export interface RuleLookup {
  readonly found: readonly RuleSource[]
  readonly missing: readonly string[]
}

export function rulesSourceDir(root: string): string {
  return join(root, 'governance', 'rules')
}

export function installedRulesDir(target: string): string {
  return join(target, '.claude', 'rules')
}

/**
 * Mirrors `rule_subdir` in `scripts/lib/gov.sh`, which stays in bash for the
 * sandbox loops. A rule sitting directly under `governance/rules/` has no
 * subdirectory and installs flat.
 */
export function ruleSubdir(src: string, rulesRoot: string): string {
  const subdir = dirname(relative(rulesRoot, src))
  return subdir === '.' ? '' : subdir
}

/**
 * Finds each rule's source file by name across the `governance/rules/`
 * subfolders. A rule with no source is reported rather than dropped, matching
 * the `(source not found, skipping)` warning the bash printed.
 */
export function lookupRules(
  root: string,
  rules: readonly string[],
): RuleLookup {
  const rulesRoot = rulesSourceDir(root)
  const byName = new Map<string, string>()

  const relPaths = [
    ...new Bun.Glob('**/*.md').scanSync({ cwd: rulesRoot, onlyFiles: true }),
  ].sort()

  for (const rel of relPaths) {
    const name = rel.slice(rel.lastIndexOf('/') + 1, -'.md'.length)
    if (!byName.has(name)) byName.set(name, join(rulesRoot, rel))
  }

  const found: RuleSource[] = []
  const missing: string[] = []

  for (const rule of rules) {
    const src = byName.get(rule)
    if (src === undefined) {
      missing.push(rule)
      continue
    }
    found.push({ rule, src, subdir: ruleSubdir(src, rulesRoot) })
  }

  return { found, missing }
}

/**
 * Copies each rule into the subdirectory it was authored in, so the installed
 * tree keeps the band structure `governance/rules/` carries. Returns the
 * target-relative paths the timeline prints.
 */
export async function installRules(
  sources: readonly RuleSource[],
  target: string,
): Promise<string[]> {
  const rulesDir = installedRulesDir(target)
  const installed: string[] = []

  for (const source of sources) {
    const dest = join(rulesDir, source.subdir, `${source.rule}.md`)
    await copyPreservingMode(source.src, dest)
    installed.push(relative(target, dest))
  }

  return installed
}

/**
 * The bash checked `<target>/standards`, but `aitk standards install` writes
 * `.claude/standards/`, which is also the path the rules reference and the
 * path the warning names. The guard therefore fired on every modern install.
 */
export function hasStandards(target: string): boolean {
  return existsSync(join(target, '.claude', 'standards'))
}
