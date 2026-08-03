import { join } from 'node:path'
import { execa } from 'execa'
import { createGovAdapter } from '@/gov/adapter'
import { createSnippetsAdapter } from '@/snippets/adapter'
import { planSync, type ScanEntry, type SyncAdapter } from '@/sync/engine'
import {
  collectSuperseded,
  detectUnmigrated,
  type SupersededEntry,
  type UnmigratedDomain,
} from '@/sync/layout'
import { buildSeedsReport, type SeedsReport } from '@/sync/seeds-report'
import {
  readStamp,
  STAMP_DOMAINS,
  type Stamp,
  stampedCommit,
  type StampDomain,
} from '@/sync/stamp'
import { createStandardsAdapter } from '@/standards/adapter'
import { isDirectory } from '@/target'

/**
 * The toolkit path whose commits change what each domain holds. `claude/skills/`
 * is deliberately absent: skills load live from the plugin directory, so they
 * never go stale and belong in the read-only section instead.
 */
const SYNCED_SOURCES: Record<StampDomain, string> = {
  standards: 'standards/',
  snippets: 'snippets/',
  governance: 'governance/rules/',
}

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
  /** This domain's own anchor, not the target's most recent sync. */
  readonly commit?: string
  readonly syncedAt?: string
  readonly counts: StateCounts
  readonly entries: readonly ScanEntry[]
  readonly upstream: readonly UpstreamCommit[]
  /**
   * Separates a toolkit that could not attribute from one that attributed and
   * found a local edit. Only the first is a capability the install lacks.
   */
  readonly historyUnavailable: boolean
}

export interface UpstreamCommit {
  readonly sha: string
  readonly subject: string
}

export interface CheckReport {
  readonly covers: readonly StampDomain[]
  readonly domains: readonly DomainReport[]
  /**
   * Reported beside the domains rather than as one of them, because seeds carry
   * no stamp and produce no change. See `@/sync/seeds-report`.
   */
  readonly seeds: SeedsReport
  readonly superseded: readonly SupersededEntry[]
  readonly unmigrated: readonly UnmigratedDomain[]
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
 *
 * An unmigrated domain counts, because running the relocation closes it. A
 * superseded artifact does not, for the same reason orphaned files do not: only
 * the user can move content they wrote, so failing a job on it leaves the job
 * red with no mechanical remedy. Seeds are excluded on the same grounds, since
 * every seed a project edits would otherwise fail the check forever.
 */
export function hasDrift(report: CheckReport): boolean {
  if (report.unmigrated.length > 0) return true

  return report.domains.some(
    (domain) =>
      domain.counts.stale +
        domain.counts.customized +
        domain.counts.drifted +
        domain.counts.stranded >
      0,
  )
}

/**
 * Bounds each domain's upstream read by that domain's own anchor and its own
 * source path. A shared anchor would let a gov sync advance the revision
 * standards measures from, silently dropping a standards change out of the read.
 */
export async function buildCheckReport(
  toolkitRoot: string,
  target: string,
): Promise<CheckReport> {
  const stamp = readStamp(target)

  const domains = await Promise.all(
    installedStampDomains(target).map((domain) =>
      buildDomainReport(toolkitRoot, target, stamp, domain),
    ),
  )

  const anchors = domains
    .map((domain) => domain.commit)
    .filter((commit): commit is string => commit !== undefined)

  return {
    covers: stamp?.covers ?? [],
    domains,
    seeds: buildSeedsReport(toolkitRoot, target),
    superseded: collectSuperseded(target),
    unmigrated: detectUnmigrated(toolkitRoot, target),
    newSkills: await readNewSkills(toolkitRoot, anchors),
  }
}

async function buildDomainReport(
  toolkitRoot: string,
  target: string,
  stamp: Stamp | undefined,
  domain: StampDomain,
): Promise<DomainReport> {
  const plan = planSync(ADAPTERS[domain](toolkitRoot), target)
  const record = stamp?.domains[domain]
  const since = stampedCommit(stamp, domain)

  return {
    domain,
    stamped: record !== undefined,
    commit: since,
    syncedAt: record?.syncedAt,
    counts: countStates(plan.entries),
    entries: plan.entries,
    historyUnavailable: plan.historyUnavailable,
    upstream:
      since === undefined
        ? []
        : await readUpstream(toolkitRoot, since, SYNCED_SOURCES[domain]),
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
  sourcePath: string,
): Promise<UpstreamCommit[]> {
  const log = await read(root, [
    'log',
    '--oneline',
    '--no-decorate',
    `${since}..HEAD`,
    '--',
    sourcePath,
  ])

  return parseUpstream(log)
}

/**
 * Skills are not domain-scoped, so the read runs from the oldest anchor across
 * domains. Over-reporting a skill costs a line, while measuring from the newest
 * would hide one that arrived before the most recent domain sync.
 */
async function readNewSkills(
  root: string,
  anchors: readonly string[],
): Promise<string[]> {
  const since = await oldestAnchor(root, anchors)
  if (since === undefined) return []

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

async function oldestAnchor(
  root: string,
  anchors: readonly string[],
): Promise<string | undefined> {
  const unique = [...new Set(anchors)]
  let oldest = unique[0]

  for (const candidate of unique.slice(1)) {
    if (await isAncestor(root, candidate, oldest)) oldest = candidate
  }

  return oldest
}

async function isAncestor(
  root: string,
  candidate: string,
  reference: string,
): Promise<boolean> {
  const result = await execa(
    'git',
    ['-C', root, 'merge-base', '--is-ancestor', candidate, reference],
    { reject: false },
  )

  return result.exitCode === 0
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
