import { readCanonJson } from './canon-cli'

/**
 * Build-time catalog reads, on the contract `counts.ts` already keeps: the CLI
 * is the source, a read that returns nothing fails the build, and no literal
 * ever stands behind a failed read. `internal/rules/claude/593-landing-page.md`
 * states why a fallback is worse than a failure.
 *
 * A non-zero exit is not itself the failure. `canon gov counts` exits 2 on
 * drift elsewhere in the tree that this page neither causes nor gates, so each
 * reader checks for parseable output rather than for a zero status.
 */

export interface GovRule {
  readonly name: string
  readonly domain: string
  readonly description: string
  readonly paths?: readonly string[]
}

export interface ToolingStack {
  readonly name: string
  readonly extends: string | null
  readonly devDeps: number
  readonly scripts: number
}

export interface StandardEntry {
  readonly name: string
  readonly description: string
  readonly appliesTo?: readonly string[]
}

/** A domain and the rules under it, largest domain first. */
export interface RuleGroup {
  readonly domain: string
  readonly total: number
  readonly sample: readonly GovRule[]
}

/**
 * Rules grouped by domain, largest first, with a sample inside each.
 *
 * The grouping is complete and the sampling sits one level down, which is the
 * distinction the treatment turns on: a flat sample of ten rules renders five
 * of the eight domains and tells the reader nothing about the three it
 * dropped, so the corpus reads smaller than it is.
 */
export function readRuleGroups(perDomain = 2): {
  groups: RuleGroup[]
  total: number
  domains: number
} {
  const { rules } = readCanonJson<{ rules: GovRule[] }>(['gov', 'list'])

  const byDomain = new Map<string, GovRule[]>()
  for (const rule of rules) {
    const held = byDomain.get(rule.domain)
    if (held) held.push(rule)
    else byDomain.set(rule.domain, [rule])
  }

  const groups = [...byDomain.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([domain, held]) => ({
      domain,
      total: held.length,
      sample: held.slice(0, perDomain),
    }))

  return { groups, total: rules.length, domains: groups.length }
}

export function readToolingStacks(): ToolingStack[] {
  return readCanonJson<{ stacks: ToolingStack[] }>(['tooling', 'list']).stacks
}

/**
 * Standards without their bodies. The catalog carries each standard's full
 * text, which the page never renders, so it is dropped at the boundary rather
 * than carried through the build.
 */
export function readStandards(): { entries: StandardEntry[]; total: number } {
  const { standards } = readCanonJson<{ standards: StandardEntry[] }>([
    'standards',
    'list',
  ])
  const entries = standards.map(({ name, description, appliesTo }) => ({
    name,
    description,
    appliesTo,
  }))
  return { entries, total: entries.length }
}

/** Where a rule loads, as the page states it. */
export function loadsWhen(rule: GovRule): {
  label: string
  scoped: boolean
} {
  const glob = rule.paths?.[0]
  return glob
    ? { label: glob, scoped: true }
    : { label: 'every session', scoped: false }
}
