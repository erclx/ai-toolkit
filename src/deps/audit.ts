import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execa } from 'execa'

/**
 * The severities the advisory index publishes, worst first.
 *
 * `info` is this module's own floor rather than one of theirs. An advisory
 * arriving under a severity nothing here recognizes still exists, and dropping
 * it would shrink the count on the day the vocabulary changed.
 */
export const SEVERITIES = [
  'critical',
  'high',
  'moderate',
  'low',
  'info',
] as const

export type Severity = (typeof SEVERITIES)[number]

export interface Advisory {
  readonly package: string
  readonly id: number
  readonly title: string
  readonly url: string
  readonly severity: Severity
  readonly vulnerableVersions?: string
}

/**
 * Why no advisory list was produced, which is never the same as a clean one.
 *
 * `no-lockfile` is split out from `no-record` because the two take different
 * remedies. An unreachable index is retried, and a project whose dependencies
 * were never resolved is installed first, so one message naming the network
 * would send half the readers at the wrong cause.
 */
export type AuditRefusal = 'no-manifest' | 'no-lockfile' | 'no-record'

/**
 * The ceiling on `bun audit --json`, which carries no timeout of its own and
 * runs to bun's own 299-second ceiling on a stall. Three consecutive clean
 * runs on this tree measured 44.7, 77.6, and 62.9 seconds, so 120 seconds
 * leaves margin over the slowest observed pass while still bounding a stall
 * well under bun's own ceiling.
 */
const AUDIT_TIMEOUT_MS = 120_000

/** The lockfiles a resolved dependency set leaves behind, in any manager. */
const LOCKFILES = [
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]

export type DepsAudit =
  | { readonly kind: 'audited'; readonly advisories: readonly Advisory[] }
  | {
      readonly kind: 'refused'
      readonly reason: AuditRefusal
      readonly message?: string
    }

function severityOf(value: unknown): Severity {
  return SEVERITIES.includes(value as Severity) ? (value as Severity) : 'info'
}

/**
 * Reads the record `bun audit --json` writes to stdout.
 *
 * The shape is an object keyed by package name, each holding that package's
 * advisories, which this flattens into one list carrying the name on every
 * entry. Returning nothing on unreadable output is what keeps an unreachable
 * index from reporting as a clean tree, and the caller turns it into a stated
 * refusal rather than a zero.
 */
export function parseAdvisories(stdout: string): Advisory[] | undefined {
  let record: unknown
  try {
    record = JSON.parse(stdout)
  } catch {
    return undefined
  }

  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    return undefined
  }

  const advisories: Advisory[] = []
  for (const [name, entries] of Object.entries(record)) {
    if (!Array.isArray(entries)) return undefined

    for (const raw of entries) {
      if (typeof raw !== 'object' || raw === null) return undefined
      const entry = raw as Record<string, unknown>

      advisories.push({
        package: name,
        id: typeof entry.id === 'number' ? entry.id : 0,
        title: typeof entry.title === 'string' ? entry.title : '',
        url: typeof entry.url === 'string' ? entry.url : '',
        severity: severityOf(entry.severity),
        ...(typeof entry.vulnerable_versions === 'string' && {
          vulnerableVersions: entry.vulnerable_versions,
        }),
      })
    }
  }

  return advisories
}

export function countBySeverity(
  advisories: readonly Advisory[],
): Record<Severity, number> {
  const counts = Object.fromEntries(
    SEVERITIES.map((severity) => [severity, 0]),
  ) as Record<Severity, number>

  for (const advisory of advisories) counts[advisory.severity] += 1
  return counts
}

/**
 * The message a caller reads for a refusal with no advisory record, naming a
 * stall as its own cause rather than folding it into "no output on stdout",
 * which is what an empty stdout reads as either way.
 */
export function noRecordMessage(result: {
  readonly timedOut: boolean
  readonly stderr: string
}): string {
  if (result.timedOut) {
    return `timed out after ${AUDIT_TIMEOUT_MS}ms waiting on the advisory index`
  }
  const line = result.stderr.trim().split('\n').pop()
  return line !== undefined && line !== '' ? line : 'no output on stdout'
}

/**
 * Shells the runtime's own advisory command rather than carrying an index.
 *
 * A vendored advisory database is a second corpus to keep current, and what
 * this check is worth is the report rather than the data. The cost is the one
 * failure mode no other audit here carries: the command reaches a network, so
 * an unreachable index has to be told from a tree with nothing against it.
 * That split is the return value, and the exit code is deliberately not read.
 * `bun audit` exits non-zero on advisories found and on a lookup that failed,
 * so the record on stdout is the only thing that separates them.
 */
export async function auditDependencies(root: string): Promise<DepsAudit> {
  if (!existsSync(join(root, 'package.json'))) {
    return { kind: 'refused', reason: 'no-manifest' }
  }

  if (!LOCKFILES.some((name) => existsSync(join(root, name)))) {
    return { kind: 'refused', reason: 'no-lockfile' }
  }

  const result = await execa('bun', ['audit', '--json'], {
    cwd: root,
    reject: false,
    timeout: AUDIT_TIMEOUT_MS,
  })

  const advisories = parseAdvisories(result.stdout)
  if (advisories === undefined) {
    return {
      kind: 'refused',
      reason: 'no-record',
      message: noRecordMessage(result),
    }
  }

  return { kind: 'audited', advisories }
}
