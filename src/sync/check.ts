import { join } from 'node:path'
import { execa } from 'execa'
import { createGovAdapter } from '@/gov/adapter'
import { createSnippetsAdapter } from '@/snippets/adapter'
import { planSync, type ScanEntry, type SyncAdapter } from '@/sync/engine'
import {
  readStamp,
  STAMP_DOMAINS,
  type Stamp,
  type StampDomain,
} from '@/sync/stamp'
import { createStandardsAdapter } from '@/standards/adapter'
import { isDirectory } from '@/target'

/**
 * Toolkit paths whose commits can change what a target holds. `claude/skills/`
 * is deliberately absent: skills load live from the plugin directory, so they
 * never go stale and belong in the read-only section instead.
 */
const SYNCED_SOURCES = ['standards/', 'governance/rules/', 'snippets/']

const ADAPTERS: Record<StampDomain, (root: string) => SyncAdapter> = {
  standards: createStandardsAdapter,
  snippets: createSnippetsAdapter,
  governance: createGovAdapter,
}

const INSTALL_MARKERS: Record<StampDomain, readonly string[]> = {
  standards: ['.claude', 'standards'],
  snippets: ['.claude', 'snippets'],
  governance: ['.claude', 'rules'],
}

export interface StateCounts {
  readonly matching: number
  readonly stale: number
  readonly customized: number
  readonly drifted: number
  readonly orphaned: number
  readonly stranded: number
}

export interface DomainReport {
  readonly domain: StampDomain
  readonly stamped: boolean
  readonly counts: StateCounts
  readonly entries: readonly ScanEntry[]
}

export interface UpstreamCommit {
  readonly sha: string
  readonly subject: string
}

export interface CheckReport {
  readonly commit?: string
  readonly syncedAt?: string
  readonly covers: readonly StampDomain[]
  readonly domains: readonly DomainReport[]
  readonly upstream: readonly UpstreamCommit[]
  readonly newSkills: readonly string[]
}

export function installedStampDomains(target: string): StampDomain[] {
  return STAMP_DOMAINS.filter((domain) =>
    isDirectory(join(target, ...INSTALL_MARKERS[domain])),
  )
}

export function countStates(entries: readonly ScanEntry[]): StateCounts {
  return {
    matching: count(entries, 'matching'),
    stale: count(entries, 'stale'),
    customized: count(entries, 'customized'),
    drifted: count(entries, 'drifted'),
    orphaned: count(entries, 'orphaned'),
    stranded: count(entries, 'stranded'),
  }
}

/**
 * Whether the target has diverged from the toolkit in a way a sync could close.
 * Orphaned files are excluded: a project-authored rule never converges, and
 * counting it would leave `--exit-code` failing forever with no remedy.
 */
export function hasDrift(report: CheckReport): boolean {
  return report.domains.some(
    (domain) =>
      domain.counts.stale +
        domain.counts.customized +
        domain.counts.drifted +
        domain.counts.stranded >
      0,
  )
}

export function scanDomains(
  toolkitRoot: string,
  target: string,
  stamp: Stamp | undefined,
): DomainReport[] {
  return installedStampDomains(target).map((domain) => {
    const plan = planSync(ADAPTERS[domain](toolkitRoot), target)

    return {
      domain,
      stamped: stamp?.domains[domain] !== undefined,
      counts: countStates(plan.entries),
      entries: plan.entries,
    }
  })
}

/**
 * Bounds the upstream read by the stamped revision, so the range is exactly
 * what has landed since the last sync and never the whole log. An unstamped
 * target skips it rather than guessing a window.
 */
export async function buildCheckReport(
  toolkitRoot: string,
  target: string,
): Promise<CheckReport> {
  const stamp = readStamp(target)
  const domains = scanDomains(toolkitRoot, target, stamp)
  const since = stamp?.commit

  if (since === undefined) {
    return {
      syncedAt: stamp?.syncedAt,
      covers: stamp?.covers ?? [],
      domains,
      upstream: [],
      newSkills: [],
    }
  }

  const [upstream, newSkills] = await Promise.all([
    readUpstream(toolkitRoot, since),
    readNewSkills(toolkitRoot, since),
  ])

  return {
    commit: since,
    syncedAt: stamp?.syncedAt,
    covers: stamp?.covers ?? [],
    domains,
    upstream,
    newSkills,
  }
}

export function parseUpstream(log: string): UpstreamCommit[] {
  const commits: UpstreamCommit[] = []

  for (const line of log.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '') continue

    const boundary = trimmed.indexOf(' ')
    if (boundary === -1) continue

    commits.push({
      sha: trimmed.slice(0, boundary),
      subject: trimmed.slice(boundary + 1),
    })
  }

  return commits
}

/** A skill is new when its `SKILL.md` was added, not when a support file was. */
export function parseNewSkills(paths: string): string[] {
  const names = paths
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith('/SKILL.md'))
    .map((line) => line.split('/').at(-2))
    .filter((name): name is string => name !== undefined)

  return [...new Set(names)].sort()
}

async function readUpstream(
  root: string,
  since: string,
): Promise<UpstreamCommit[]> {
  const log = await read(root, [
    'log',
    '--oneline',
    '--no-decorate',
    `${since}..HEAD`,
    '--',
    ...SYNCED_SOURCES,
  ])

  return parseUpstream(log)
}

async function readNewSkills(root: string, since: string): Promise<string[]> {
  const paths = await read(root, [
    'diff',
    '--name-only',
    '--diff-filter=A',
    `${since}..HEAD`,
    '--',
    'claude/skills/',
  ])

  return parseNewSkills(paths)
}

/**
 * A toolkit outside a git clone, or a stamped revision this clone has never
 * seen, yields no range. The per-file report still stands on its own.
 */
async function read(root: string, args: readonly string[]): Promise<string> {
  const result = await execa('git', ['-C', root, ...args], { reject: false })
  return result.exitCode === 0 ? result.stdout : ''
}

function count(
  entries: readonly ScanEntry[],
  state: ScanEntry['state'],
): number {
  return entries.filter((entry) => entry.state === state).length
}
