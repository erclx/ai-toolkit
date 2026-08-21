import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { listRepositoryFiles } from '@/git-files'
import { isExempt } from '@/secrets/marker'
import { matchLine } from '@/secrets/patterns'
import { readShipEntries, selectShipped } from '@/secrets/shipped'

export interface SecretFinding {
  readonly file: string
  /** One-based, matching the `file:line` form a reader clicks. */
  readonly line: number
  readonly column: number
  readonly pattern: string
  readonly label: string
  readonly preview: string
}

/** Why a scan produced no corpus, which is never the same as a clean one. */
export type ScanRefusal = 'no-manifest' | 'no-git' | 'no-shipped-files'

export type SecretScan =
  | {
      readonly kind: 'scanned'
      /** Files opened, so a report can state what the verdict covers. */
      readonly files: number
      readonly skipped: number
      readonly findings: readonly SecretFinding[]
    }
  | { readonly kind: 'refused'; readonly reason: ScanRefusal }

/**
 * Whether the bytes are something a line scanner should not read.
 *
 * A NUL byte rather than an extension list, since the shipped tree carries
 * fonts and images under names this check has no reason to enumerate, and a
 * list would go stale the first time a format was added. Decoded text holds no
 * NUL, so the test costs one scan and never rejects source.
 */
export function isBinary(text: string): boolean {
  return text.includes('\0')
}

/** Every finding in one file's text, with the marker already applied. */
export function scanText(file: string, text: string): SecretFinding[] {
  const lines = text.split('\n')
  const findings: SecretFinding[] = []

  for (const [index, line] of lines.entries()) {
    const hits = matchLine(line)
    if (hits.length === 0 || isExempt(lines, index)) continue

    for (const hit of hits) {
      findings.push({ file, line: index + 1, ...hit })
    }
  }

  return findings
}

/**
 * Scans the tree this repository publishes, not the tree it holds.
 *
 * A refusal rather than an empty result wherever the corpus cannot be built.
 * Zero findings over zero files reads in the report exactly like zero findings
 * over the whole shipped tree, and the two mean opposite things, which is the
 * split every other audit here already draws.
 */
export async function scanShippedTree(root: string): Promise<SecretScan> {
  const entries = await readShipEntries(root)
  if (entries === undefined) return { kind: 'refused', reason: 'no-manifest' }

  const listed = await listRepositoryFiles(root)
  if (listed === undefined) return { kind: 'refused', reason: 'no-git' }

  const paths = selectShipped(listed, entries)
  if (paths.length === 0) {
    return { kind: 'refused', reason: 'no-shipped-files' }
  }

  const findings: SecretFinding[] = []
  let scanned = 0
  let skipped = 0

  for (const path of paths) {
    let text: string
    try {
      text = await readFile(join(root, path), 'utf8')
    } catch {
      // A listed path that will not open is a symlink pointing outside the
      // tree or a file removed since git answered. Counted rather than
      // reported, so the run still states that it measured less than it listed.
      skipped += 1
      continue
    }

    if (isBinary(text)) {
      skipped += 1
      continue
    }

    scanned += 1
    findings.push(...scanText(path, text))
  }

  return { kind: 'scanned', files: scanned, skipped, findings }
}
