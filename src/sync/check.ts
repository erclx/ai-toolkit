import { existsSync } from 'node:fs'
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
  type Stamp,
  stampedChain,
  stampedCommit,
  type StampDomain,
} from '@/sync/stamp'
import { createStandardsAdapter } from '@/standards/adapter'
import { isDirectory } from '@/target'
import { loadManifest } from '@/tooling/manifest'
import { scan } from '@/tooling/scan'

/**
 * Domains the sync engine walks file by file. Tooling is a stamp domain without
 * being one of these, because `src/tooling/` never calls `planSync`, so the
 * three lookups below have no entry to offer it.
 */
export const SCANNED_DOMAINS = [
  'standards',
  'snippets',
  'governance',
] as const satisfies readonly StampDomain[]

export type ScannedDomain = (typeof SCANNED_DOMAINS)[number]

/**
 * The toolkit path whose commits change what each domain holds. `claude/skills/`
 * is deliberately absent: skills load live from the plugin directory, so they
 * never go stale and belong in the read-only section instead.
 */
const SYNCED_SOURCES: Record<ScannedDomain, string> = {
  standards: 'standards/',
  snippets: 'snippets/',
  governance: 'governance/rules/',
}

const ADAPTERS: Record<ScannedDomain, (root: string) => SyncAdapter> = {
  standards: createStandardsAdapter,
  snippets: createSnippetsAdapter,
  governance: createGovAdapter,
}

const INSTALL_MARKERS: Record<ScannedDomain, readonly string[]> = {
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
  readonly domain: ScannedDomain
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

/** Pending changes per category, from the same scan `aitk tooling sync` reads. */
export interface ToolingCounts {
  readonly configs: number
  readonly seeds: number
  readonly scripts: number
  readonly deps: number
  readonly gitignore: number
  readonly references: number
}

/**
 * Tooling's own section. `measured` is the field the report exists for: without
 * it a target that never installed tooling and a target whose tooling is current
 * both render as zero changes, which is a claim rather than an absence of one.
 */
export interface ToolingReport {
  readonly measured: boolean
  /**
   * Stack names the install resolved, nearest first. Carried even when the
   * report is unmeasured, so a chain naming stacks this toolkit no longer ships
   * stays distinguishable from a target that recorded none.
   */
  readonly chain: readonly string[]
  readonly commit?: string
  readonly syncedAt?: string
  readonly counts: ToolingCounts
  readonly changes: number
}

const UNMEASURED_TOOLING: ToolingReport = {
  measured: false,
  chain: [],
  counts: {
    configs: 0,
    seeds: 0,
    scripts: 0,
    deps: 0,
    gitignore: 0,
    references: 0,
  },
  changes: 0,
}

export interface CheckReport {
  readonly covers: readonly StampDomain[]
  /** False when the target is not a toolkit project, so every section stays empty. */
  readonly managed: boolean
  readonly domains: readonly DomainReport[]
  /**
   * Reported beside the domains rather than as one of them, because tooling
   * carries no per-file entries and no upstream range, so it fills almost none
   * of `DomainReport`.
   */
  readonly tooling: ToolingReport
  /**
   * Reported beside the domains rather than as one of them, because seeds carry
   * no stamp and produce no change. See `@/sync/seeds-report`.
   */
  readonly seeds: SeedsReport
  readonly superseded: readonly SupersededEntry[]
  readonly unmigrated: readonly UnmigratedDomain[]
  readonly newSkills: readonly string[]
}

export function installedStampDomains(target: string): ScannedDomain[] {
  return SCANNED_DOMAINS.filter((domain) =>
    isDirectory(join(target, ...INSTALL_MARKERS[domain])),
  )
}

/**
 * Reads the chain the install recorded and scans against those stacks rather
 * than re-resolving from the leaf. A run that passed `--skip` installed fewer
 * layers than the leaf's own chain reproduces, so re-resolving would report
 * drift against a layer the target deliberately does not carry.
 *
 * A recorded stack the toolkit no longer ships resolves to nothing, and a chain
 * where none resolve reads as unmeasured. Scanning the survivors would measure
 * against a chain neither side agrees on.
 */
export function buildToolingReport(
  toolkitRoot: string,
  target: string,
  stamp: Stamp | undefined,
): ToolingReport {
  const chain = stampedChain(stamp)
  const manifests = chain
    .map((name) => loadManifest(toolkitRoot, name))
    .filter((manifest) => manifest !== undefined)

  if (manifests.length === 0) return { ...UNMEASURED_TOOLING, chain }

  const result = scan(manifests, target, { includeReferences: true })
  const record = stamp?.domains.tooling

  return {
    measured: true,
    chain,
    commit: record?.commit,
    syncedAt: record?.syncedAt,
    counts: {
      configs: result.configs.filter((entry) => entry.state !== 'matching')
        .length,
      seeds: result.seeds.filter((entry) => entry.state === 'missing').length,
      scripts: result.scripts.filter((entry) => entry.state !== 'matching')
        .length,
      deps: result.deps.filter((entry) => entry.state === 'missing').length,
      gitignore: result.gitignore.filter((entry) => entry.state === 'missing')
        .length,
      references: result.references.filter((entry) => entry.state === 'pending')
        .length,
    },
    changes: result.totalChanges,
  }
}

/**
 * Whether the target is a toolkit-managed project at all. Seeds are enumerated
 * from the source rather than from what a target installed, so without this gate
 * a directory the toolkit has never touched reports every seed as `missing` and
 * routes to a skill that reconciles section by section. `installedStampDomains`
 * gates the three scanned domains the same way, which is why they stay quiet on
 * the same directory.
 *
 * An unmigrated domain counts as a marker in its own right. `detectUnmigrated`
 * fires only on root files whose basename the toolkit ships, so it firing proves
 * the toolkit installed here before the layout moved under `.claude/`. Reading
 * only the markers would report such a target as unmanaged while the same report
 * carried its unmigrated domain, and a consumer reading the JSON would route to
 * the relocation while the rendered half routed to install.
 */
export function isManagedTarget(
  target: string,
  unmigrated: readonly UnmigratedDomain[],
): boolean {
  if (unmigrated.length > 0) return true

  return (
    isDirectory(join(target, '.claude')) ||
    existsSync(join(target, 'CLAUDE.md'))
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
 *
 * Tooling is excluded on exactly the seeds grounds: a golden config is one the
 * project is expected to edit, so a job counting it stays red with no remedy.
 * Being unmeasured is not what excludes it, since an unmeasured report carries
 * zero changes and would pass a count either way.
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

  const unmigrated = detectUnmigrated(toolkitRoot, target)
  const managed = isManagedTarget(target, unmigrated)

  if (!managed) {
    return {
      covers: [],
      managed,
      domains: [],
      tooling: UNMEASURED_TOOLING,
      seeds: { entries: [], historyUnavailable: false },
      superseded: [],
      unmigrated: [],
      newSkills: [],
    }
  }

  return {
    covers: stamp?.covers ?? [],
    managed,
    domains,
    tooling: buildToolingReport(toolkitRoot, target, stamp),
    seeds: buildSeedsReport(toolkitRoot, target),
    superseded: collectSuperseded(target),
    unmigrated,
    newSkills: await readNewSkills(toolkitRoot, anchors),
  }
}

async function buildDomainReport(
  toolkitRoot: string,
  target: string,
  stamp: Stamp | undefined,
  domain: ScannedDomain,
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
