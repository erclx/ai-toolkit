import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { listRepositoryFiles } from '@/git-files'

/**
 * Suppresses citation checking for the source line carrying it.
 *
 * Prose that teaches a naming pattern displays a path rather than pointing at
 * one, and no syntax separates the two: an illustration and a reference are
 * both inline code in a sentence. Location covers the fixture trees and fenced
 * examples, and this covers what is left, which is a sentence naming a
 * hypothetical entry to show the shape of the name.
 */
export const IGNORE_MARKER = 'audit-ignore-citations'

/**
 * Trees holding content authored to be parsed rather than followed.
 *
 * Sandbox scenarios describe paths inside their own scratch fixtures and the
 * eval harness names paths in its target project. Neither is a reference into
 * this repository, so an unresolved path there is correct rather than stale.
 */
const FIXTURE_TREES: readonly string[] = ['scripts/sandbox/', 'scripts/eval/']

const FIXTURE_SEGMENTS: readonly string[] = ['fixtures', '__fixtures__']

const FENCE = /^\s*(```|~~~)/

export interface Citation {
  readonly file: string
  readonly line: number
  readonly path: string
}

export function isFixture(rel: string): boolean {
  if (rel.endsWith('.test.ts')) return true
  if (FIXTURE_TREES.some((tree) => rel.startsWith(tree))) return true
  return rel.split('/').some((segment) => FIXTURE_SEGMENTS.includes(segment))
}

export function citationPattern(folders: readonly string[]): RegExp {
  const names = folders.map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  return new RegExp(
    `\\.claude/(?:${names.join('|')})/[A-Za-z0-9._/-]+\\.md`,
    'g',
  )
}

/**
 * Pulls the cited paths out of one file's text.
 *
 * Fenced blocks are skipped for markdown only. A fence is markdown syntax, and
 * applying it to a shell or TypeScript source would let a heredoc of triple
 * backticks silently hide the rest of the file.
 */
export function collectCitations(
  rel: string,
  text: string,
  pattern: RegExp,
): Citation[] {
  const isMarkdown = rel.endsWith('.md')
  const found: Citation[] = []
  let fenced = false

  for (const [index, line] of text.split('\n').entries()) {
    if (isMarkdown && FENCE.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced || line.includes(IGNORE_MARKER)) continue

    for (const match of line.matchAll(pattern)) {
      found.push({ file: rel, line: index + 1, path: match[0] })
    }
  }

  return found
}

/**
 * `unavailable` is a distinct state from a clean scan.
 *
 * Finding nothing and being unable to look mean opposite things, and only one
 * of them should let a push through.
 */
export type CitationReport =
  | {
      readonly kind: 'scanned'
      readonly scanned: number
      readonly total: number
      readonly unresolved: readonly Citation[]
    }
  | { readonly kind: 'unavailable' }

/**
 * Resolves every cited path outside the fixture trees.
 *
 * This is the only check that gates the repository check, which makes it the
 * only one whose false positives cost a contributor anything. It reports a
 * finding solely for a path that does not resolve on disk, and the exclusions
 * above are what keep that from firing on prose about paths.
 */
export async function auditCitations(
  root: string,
  folders: readonly string[],
): Promise<CitationReport> {
  const pattern = citationPattern(folders)
  const listed = await listRepositoryFiles(root)
  if (!listed) return { kind: 'unavailable' }

  const candidates = listed.filter((rel) => !isFixture(rel))
  const citations: Citation[] = []

  for (const rel of candidates) {
    const path = resolve(root, rel)
    if (!existsSync(path)) continue

    let text: string
    try {
      text = await readFile(path, 'utf8')
    } catch {
      continue
    }

    citations.push(...collectCitations(rel, text, pattern))
  }

  return {
    kind: 'scanned',
    scanned: candidates.length,
    total: citations.length,
    unresolved: citations.filter(
      (citation) => !existsSync(resolve(root, citation.path)),
    ),
  }
}
