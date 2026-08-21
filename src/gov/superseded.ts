import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isMarked } from '@/exempt-marker'
import { listRepositoryFiles } from '@/git-files'
import { isBinary } from '@/secrets/scan'

/**
 * The inline token exempting one line from this sweep, shaped on the
 * `aitk-allow-secret` precedent and read by the same two-line rule.
 *
 * A declaration disagreeing with a convention for a stated reason is the case
 * question 3 of the plan settled against gating on, and the marker is where
 * that reason goes. A bare token names nothing a later reader can weigh, so it
 * mutes nothing.
 */
export const SUPERSEDED_MARKER = 'aitk-allow-superseded'

export interface SupersededHit {
  readonly file: string
  /** One-based, matching the `file:line` form a reader clicks. */
  readonly line: number
  readonly column: number
  /**
   * Whether the replacement sits on the same line, outside the superseded
   * occurrences themselves.
   *
   * Read outside them because the replacement is routinely a substring of the
   * value it replaced, which is what a convention dropping a segment produces.
   * A plain containment test answers true for every line under that shape and
   * separates nothing.
   *
   * A reading aid rather than a filter. The line stating the change carries
   * both values and so does a fixture halfway through a repair, and nothing
   * here can tell those apart. Suppressing on it would hide the second case,
   * which is the whole class this sweep exists to reach.
   */
  readonly carriesReplacement: boolean
  readonly preview: string
}

export interface SupersededOptions {
  /** The value the convention used to produce, matched as a literal substring. */
  readonly superseded: string
  /** What it produces now, reported so a finding names what to write instead. */
  readonly replacement: string
}

export type SupersededReport =
  | {
      readonly kind: 'measured'
      readonly superseded: string
      readonly replacement: string
      /** Everything git listed, so the report states its own bound. */
      readonly listed: number
      /** Files opened, which is what the verdict actually covers. */
      readonly files: number
      /** Binary or unreadable, counted so a pass is not claimed over them. */
      readonly skipped: number
      readonly findings: readonly SupersededHit[]
      readonly exempt: readonly SupersededHit[]
    }
  | { readonly kind: 'unreadable'; readonly reason: string }

/**
 * The longest preview a hit carries. A generated or minified line is one line
 * to git and a screen of noise to a reader, and the report prints one hit per
 * line found.
 */
const PREVIEW_LIMIT = 200

/**
 * Whether `replacement` appears on the line somewhere other than inside the
 * superseded occurrences, which is what makes the flag mean anything when one
 * value contains the other.
 */
function carriesReplacement(line: string, options: SupersededOptions): boolean {
  return line.split(options.superseded).join('').includes(options.replacement)
}

/** Every occurrence of `superseded` in one file's text, exemptions separated. */
export function sweepText(
  file: string,
  text: string,
  options: SupersededOptions,
): { findings: SupersededHit[]; exempt: SupersededHit[] } {
  const lines = text.split('\n')
  const findings: SupersededHit[] = []
  const exempt: SupersededHit[] = []

  for (const [index, line] of lines.entries()) {
    let column = line.indexOf(options.superseded)
    if (column === -1) continue

    const muted = isMarked(lines, index, SUPERSEDED_MARKER)
    const bucket = muted ? exempt : findings
    const trimmed = line.trim()
    const preview =
      trimmed.length > PREVIEW_LIMIT
        ? `${trimmed.slice(0, PREVIEW_LIMIT)}…`
        : trimmed
    const alsoReplacement = carriesReplacement(line, options)

    while (column !== -1) {
      bucket.push({
        file,
        line: index + 1,
        column: column + 1,
        carriesReplacement: alsoReplacement,
        preview,
      })
      column = line.indexOf(options.superseded, column + 1)
    }
  }

  return { findings, exempt }
}

/**
 * Where the tree still asserts a value the convention behind it no longer
 * produces, keyed on the value rather than on the file stating the rule.
 *
 * The file-scoped map is what this exists against. A fixture asserting an old
 * output names neither the rule nor the standard, so nothing reaches it from
 * the change that superseded it, and the value it carries is the only key both
 * sides share.
 *
 * This reports and never gates. A string appears for reasons unrelated to the
 * convention, so the output is a reading a person settles, and the counts of
 * what was listed, opened, and skipped are what keep it from reading as a
 * verdict over the whole tree.
 *
 * What it cannot see is a prose reference that went stale without carrying the
 * value, such as a declaration citing the wrong standard for the transform. A
 * value sweep closes most of this class and no part of that one.
 */
export async function readSuperseded(
  root: string,
  options: SupersededOptions,
): Promise<SupersededReport> {
  if (options.superseded === '') {
    return {
      kind: 'unreadable',
      reason:
        'The superseded value is empty, which matches every line in the tree rather than a convention.',
    }
  }

  if (options.superseded === options.replacement) {
    return {
      kind: 'unreadable',
      reason: `The superseded value and its replacement are both ${options.superseded}, so no convention changed and there is nothing to sweep for.`,
    }
  }

  const listed = await listRepositoryFiles(root)
  if (listed === undefined) {
    return {
      kind: 'unreadable',
      reason: `Git listed no corpus under ${root}. An empty list passes each of its zero files, so a tree git cannot read refuses rather than reporting clean.`,
    }
  }

  const findings: SupersededHit[] = []
  const exempt: SupersededHit[] = []
  let files = 0
  let skipped = 0

  for (const path of listed) {
    let text: string
    try {
      text = await readFile(join(root, path), 'utf8')
    } catch {
      // A listed path that will not open is a symlink leaving the tree or a
      // file removed since git answered. Counted rather than reported, so the
      // run still states that it measured less than it listed.
      skipped += 1
      continue
    }

    if (isBinary(text)) {
      skipped += 1
      continue
    }

    files += 1
    const swept = sweepText(path, text, options)
    findings.push(...swept.findings)
    exempt.push(...swept.exempt)
  }

  return {
    kind: 'measured',
    superseded: options.superseded,
    replacement: options.replacement,
    listed: listed.length,
    files,
    skipped,
    findings,
    exempt,
  }
}
