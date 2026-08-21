import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, sep } from 'node:path'
import { execa } from 'execa'

/**
 * Domains the stamp can record. The first two attribute file by file through
 * the sync engine. Tooling runs its own inject and manifest machinery, so it
 * records the stack chain it resolved instead and carries no file hashes.
 *
 * A stamp written before the standards install channel closed still carries a
 * `standards` record. `isStamp` ignores the key and `sortDomains` drops it on
 * the next write, so the target loses a domain nothing can refresh rather than
 * losing the whole file.
 */
export const STAMP_DOMAINS = ['snippets', 'governance', 'tooling'] as const

export type StampDomain = (typeof STAMP_DOMAINS)[number]

/** What a domain needs to stamp itself: its key, and the clone to date it against. */
export interface StampSource {
  readonly domain: StampDomain
  readonly toolkitRoot: string
}

/** Target-relative posix path to content hash, for one domain. */
export type DomainHashes = Readonly<Record<string, string>>

/**
 * One domain's record. The anchor sits here rather than at the top level
 * because domains sync independently, and a shared anchor would let a gov sync
 * advance the revision standards measures its upstream range from.
 */
export interface DomainStamp {
  /** Toolkit revision this domain last synced from. Absent outside a git clone. */
  readonly commit?: string
  readonly syncedAt: string
  readonly files: DomainHashes
  /**
   * Stack names the install resolved, nearest stack first. Present only for
   * tooling. An ordered chain rather than the leaf name, because a stack that
   * extends another cannot be reinstalled from its leaf alone, and a `--skip`
   * run installs fewer layers than the leaf's own chain would reproduce.
   */
  readonly chain?: readonly string[]
}

export interface Stamp {
  /** Domains actually stamped in this target, so an unstamped one is legible. */
  readonly covers: readonly StampDomain[]
  readonly domains: Readonly<Partial<Record<StampDomain, DomainStamp>>>
}

export function stampPath(target: string): string {
  return join(target, '.claude', 'aitk', 'config.json')
}

export function hashContent(content: Buffer | string): string {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

export function hashFile(path: string): string {
  return hashContent(readFileSync(path))
}

/**
 * Keys are stored posix-style so a stamp written on one platform still
 * resolves on another.
 */
export function toStampKey(rel: string): string {
  return rel.split(sep).join('/')
}

/**
 * A missing or corrupt stamp reads as absent rather than failing, which is what
 * keeps every unstamped target on the existing unattributed path.
 */
export function readStamp(target: string): Stamp | undefined {
  const path = stampPath(target)
  if (!existsSync(path)) return undefined

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return isStamp(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

/** The revision this domain last synced from, which bounds its upstream range. */
export function stampedCommit(
  stamp: Stamp | undefined,
  domain: StampDomain,
): string | undefined {
  return stamp?.domains[domain]?.commit
}

export function stampedHashes(
  stamp: Stamp | undefined,
  domain: StampDomain | undefined,
): DomainHashes {
  if (stamp === undefined || domain === undefined) return {}
  return stamp.domains[domain]?.files ?? {}
}

/**
 * The stack chain tooling last installed. An empty result is the state every
 * target predating the tooling record sits in, and the report reads it as
 * unmeasured rather than as clean.
 */
export function stampedChain(stamp: Stamp | undefined): readonly string[] {
  return stamp?.domains.tooling?.chain ?? []
}

/**
 * Replaces one domain's record and leaves the others untouched, because domains
 * install and sync independently but share the one file.
 */
export async function writeStamp(
  target: string,
  source: StampSource,
  hashes: DomainHashes,
  now: Date,
): Promise<void> {
  await putDomain(target, source, { files: sortKeys(hashes) }, now)
}

/**
 * Records what tooling installed. `files` stays empty because `src/tooling/`
 * never runs the sync engine, so there is no per-file attribution to store and
 * the chain is the whole record.
 */
export async function writeChainStamp(
  target: string,
  toolkitRoot: string,
  chain: readonly string[],
  now: Date,
): Promise<void> {
  await putDomain(
    target,
    { domain: 'tooling', toolkitRoot },
    { files: {}, chain: [...chain] },
    now,
  )
}

async function putDomain(
  target: string,
  source: StampSource,
  payload: Pick<DomainStamp, 'files' | 'chain'>,
  now: Date,
): Promise<void> {
  const previous = readStamp(target)
  const commit = await toolkitCommit(source.toolkitRoot)

  const record: DomainStamp = {
    ...(commit === undefined ? {} : { commit }),
    syncedAt: now.toISOString(),
    ...payload,
  }

  const domains = sortDomains({
    ...previous?.domains,
    [source.domain]: record,
  })

  const stamp: Stamp = {
    covers: STAMP_DOMAINS.filter((domain) => domains[domain] !== undefined),
    domains,
  }

  const path = stampPath(target)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(stamp, null, 2)}\n`)
}

const commitCache = new Map<string, Promise<string | undefined>>()

/**
 * Resolved once per clone per process. A toolkit reached outside a git clone
 * yields no commit, which costs the report its upstream range but not its
 * per-file attribution.
 */
export function toolkitCommit(root: string): Promise<string | undefined> {
  const cached = commitCache.get(root)
  if (cached !== undefined) return cached

  const pending = readCommit(root)
  commitCache.set(root, pending)
  return pending
}

async function readCommit(root: string): Promise<string | undefined> {
  const result = await execa(
    'git',
    ['-C', root, 'rev-parse', '--short', 'HEAD'],
    { reject: false },
  )

  return result.exitCode === 0 && result.stdout.trim() !== ''
    ? result.stdout.trim()
    : undefined
}

/** Deterministic key order keeps a re-sync diff empty and a merge conflict local. */
function sortKeys(hashes: DomainHashes): DomainHashes {
  return Object.fromEntries(
    Object.entries(hashes).sort(([left], [right]) => left.localeCompare(right)),
  )
}

function sortDomains(
  domains: Partial<Record<StampDomain, DomainStamp>>,
): Partial<Record<StampDomain, DomainStamp>> {
  const sorted: Partial<Record<StampDomain, DomainStamp>> = {}
  for (const domain of STAMP_DOMAINS) {
    const record = domains[domain]
    if (record !== undefined) sorted[domain] = record
  }

  return sorted
}

/**
 * Validates every recognized domain record rather than only the container. A
 * stamp whose domain value is the wrong shape would otherwise reach
 * `attribute`, where a bad hash lookup silently reads as a customization.
 *
 * A key naming no current domain is ignored rather than failing the parse. A
 * target stamped before the standards install channel closed carries one, and
 * rejecting the file would read as unstamped and then drop the three records it
 * does carry on the next write. `sortDomains` retires the key at that write.
 */
function isStamp(value: unknown): value is Stamp {
  if (!isRecord(value) || !isRecord(value.domains)) return false

  return Object.entries(value.domains)
    .filter(([domain]) => (STAMP_DOMAINS as readonly string[]).includes(domain))
    .every(([, record]) => isDomainStamp(record))
}

/**
 * `chain` is optional, which is what keeps a stamp written before tooling
 * joined the domains readable rather than parsing as corrupt and discarding
 * the three records it does carry.
 */
function isDomainStamp(value: unknown): value is DomainStamp {
  if (!isRecord(value) || !isRecord(value.files)) return false
  if (typeof value.syncedAt !== 'string') return false
  if (value.commit !== undefined && typeof value.commit !== 'string') {
    return false
  }
  if (value.chain !== undefined && !isStringArray(value.chain)) return false

  return Object.values(value.files).every((hash) => typeof hash === 'string')
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
