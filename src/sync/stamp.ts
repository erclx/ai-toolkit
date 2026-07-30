import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, sep } from 'node:path'
import { execa } from 'execa'

/**
 * Domains the stamp can attribute. Tooling runs its own inject and manifest
 * machinery rather than the sync engine, so it is absent by design and a
 * reader can tell an uncovered domain from a clean one.
 */
export const STAMP_DOMAINS = ['standards', 'snippets', 'governance'] as const

export type StampDomain = (typeof STAMP_DOMAINS)[number]

/** What a domain needs to stamp itself: its key, and the clone to date it against. */
export interface StampSource {
  readonly domain: StampDomain
  readonly toolkitRoot: string
}

/** Target-relative posix path to content hash, for one domain. */
export type DomainHashes = Readonly<Record<string, string>>

export interface Stamp {
  /** Toolkit revision the last sync ran from. Absent outside a git clone. */
  readonly commit?: string
  readonly syncedAt: string
  readonly covers: readonly StampDomain[]
  readonly domains: Readonly<Partial<Record<StampDomain, DomainHashes>>>
}

export function stampPath(target: string): string {
  return join(target, '.claude', 'aitk.json')
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

export function stampedHashes(
  stamp: Stamp | undefined,
  domain: StampDomain | undefined,
): DomainHashes {
  if (stamp === undefined || domain === undefined) return {}
  return stamp.domains[domain] ?? {}
}

/**
 * Replaces one domain's hashes and leaves the others untouched, because domains
 * install and sync independently but share the one file.
 */
export async function writeStamp(
  target: string,
  source: StampSource,
  hashes: DomainHashes,
  now: Date,
): Promise<void> {
  const previous = readStamp(target)
  const commit = await toolkitCommit(source.toolkitRoot)

  const stamp: Stamp = {
    ...(commit === undefined ? {} : { commit }),
    syncedAt: now.toISOString(),
    covers: [...STAMP_DOMAINS],
    domains: sortDomains({
      ...previous?.domains,
      [source.domain]: sortKeys(hashes),
    }),
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
  domains: Partial<Record<StampDomain, DomainHashes>>,
): Partial<Record<StampDomain, DomainHashes>> {
  const sorted: Partial<Record<StampDomain, DomainHashes>> = {}
  for (const domain of STAMP_DOMAINS) {
    const hashes = domains[domain]
    if (hashes !== undefined) sorted[domain] = hashes
  }

  return sorted
}

function isStamp(value: unknown): value is Stamp {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.syncedAt === 'string' &&
    typeof candidate.domains === 'object' &&
    candidate.domains !== null
  )
}
