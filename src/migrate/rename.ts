/**
 * The token rewrite behind the `aitk` to `canon` rename.
 *
 * The sweep is mechanical and its danger is entirely in what it must not
 * touch, so the scanner is one pass with the protected forms tried first
 * rather than a chain of replacements. A chain reprocesses its own output,
 * which is how a protected form that contains the token gets rewritten by a
 * later rule that cannot see it was already decided.
 */

/**
 * Forms carrying the token that name something other than this tool, matched
 * ahead of the token itself so they pass through untouched.
 *
 * `aitk-sandbox` is a separate repository that is not being renamed. It has to
 * win against the bare token, and it also has to win against the owner-scoped
 * spelling, since `erclx/aitk-sandbox` would otherwise rewrite to
 * `erclx/canon-sandbox` and name a repository that does not exist.
 */
const PROTECTED = ['aitk-sandbox'] as const

/**
 * Every spelling of the token, and what each becomes. Case is carried in the
 * map rather than derived, because the uppercase form is an environment
 * variable prefix and the title-case form is a heading word, and a derived
 * transform would have to guess which convention it was looking at.
 */
const REPLACEMENT: Readonly<Record<string, string>> = {
  aitk: 'canon',
  AITK: 'CANON',
  Aitk: 'Canon',
}

/**
 * One alternation so the engine decides each position once. Group 1 is a
 * protected form and group 2 is a token to rewrite, and the protected branch
 * sits first because a regex alternation is ordered.
 */
const SCAN = new RegExp(
  `(${PROTECTED.join('|')})|(${Object.keys(REPLACEMENT).join('|')})`,
  'g',
)

/**
 * Files whose content is left alone entirely.
 *
 * The changelog is release history. Its entries record what shipped under the
 * old name, so rewriting them falsifies the record, and the pull request links
 * it carries keep resolving because GitHub redirects a renamed repository's
 * old URLs.
 *
 * The sweep's own source is the other member, and it is not a preference. This
 * module states the token map as literal keys, so rewriting it turns every key
 * into its own replacement and leaves a rewriter that maps `canon` to `canon`
 * and matches nothing. Its tests name both spellings on purpose for the same
 * reason, and the command's help text documents the old name a caller is
 * migrating off. Whatever these four files should say after the rename is
 * written by hand, because the sweep cannot be the thing that decides it.
 */
/**
 * An eval result is a transcript. It records the commands a session actually
 * ran and the paths it actually opened, under whatever name was current when
 * the run happened, so rewriting one makes it testify to a session that never
 * took place. The changelog is excluded for the same reason and differs only
 * in living at a fixed path.
 */
const EXCLUDED_PREFIXES: readonly string[] = [
  'src/migrate/',
  'scripts/eval/result-',
]

/**
 * The four test files below exist to prove the retired spellings still
 * resolve, so both names appear in each on purpose. Rewriting one is worse
 * than a broken test: the retired-variable case would collapse into a copy of
 * the current-variable case beside it and keep passing, reporting coverage for
 * a fallback nothing exercises any more.
 */
const EXCLUDED_PATHS: readonly string[] = [
  'CHANGELOG.md',
  'src/commands/migrate.ts',
  'src/sync/stamp.test.ts',
  'src/targets/registry.test.ts',
  'src/targets/sweep.test.ts',
  'src/ui.test.ts',
]

export interface ScanCount {
  readonly renamed: number
  readonly protectedCount: number
}

export function isExcludedPath(path: string): boolean {
  if (EXCLUDED_PATHS.includes(path)) return true
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * An indefinite article that agreed with the retired name and no longer
 * agrees with the replacement.
 *
 * The old name opens on a vowel sound and the new one does not, so every
 * `an aitk` in the corpus reads wrong the moment the token moves. This matches
 * against the already-rewritten text rather than the source, which is what
 * keeps it clear of the protected forms: `an aitk-sandbox` still says
 * `aitk-sandbox` afterward, so it never matches here.
 *
 * The tail rejects a following letter rather than asking for a word boundary,
 * which is what separates `an canonical` from `an CANON_STATE_DIR`. A boundary
 * treats the underscore as part of the word and declines the environment
 * variable, where the whole identifier is the token continuing.
 */
const ARTICLE = /\b([Aa])n(\s+`?)(canon|CANON|Canon)(?![A-Za-z])/g

/**
 * Marks a line that names the retired spelling on purpose.
 *
 * A fallback path, a retired environment variable, and a dictionary entry
 * covering the record corpora all have to keep saying the old name, and a
 * second run over an already-renamed tree would otherwise strip exactly the
 * compatibility this rename shipped. The marker sits on the line itself or on
 * the one above it, which is the same placement `canon-allow-superseded`
 * already uses in this repository.
 */
const KEEP_MARKER = 'canon-keep-retired'

/** Rewrites every unprotected spelling of the token. */
export function renameText(text: string): string {
  const lines = text.split('\n')
  const rewritten = lines.map((line, index) =>
    isKept(lines, index) ? line : renameLine(line),
  )

  return rewritten.join('\n')
}

function isKept(lines: readonly string[], index: number): boolean {
  if (lines[index]?.includes(KEEP_MARKER)) return true
  return index > 0 && (lines[index - 1]?.includes(KEEP_MARKER) ?? false)
}

function renameLine(line: string): string {
  const replaced = line.replace(SCAN, (match, guarded: string | undefined) =>
    guarded === undefined ? REPLACEMENT[match] : guarded,
  )

  return replaced.replace(
    ARTICLE,
    (_match, article: string, gap: string, token: string) =>
      `${article}${gap}${token}`,
  )
}

/**
 * What `renameText` would do, without doing it. Reported rather than inferred
 * from a diff so a run can say how much it protected, which is the number a
 * reader needs to trust that the exclusions fired at all.
 */
export function scanText(text: string): ScanCount {
  let renamed = 0
  let protectedCount = 0
  const lines = text.split('\n')

  for (const [index, line] of lines.entries()) {
    if (isKept(lines, index)) continue

    for (const [, guarded] of line.matchAll(SCAN)) {
      if (guarded === undefined) renamed += 1
      else protectedCount += 1
    }
  }

  return { renamed, protectedCount }
}

/**
 * The path a file moves to. Runs the same scanner as the content rewrite, so
 * a protected form appearing in a path is protected there too and the two
 * halves of the sweep cannot disagree about what the token means.
 */
export function renamePath(path: string): string {
  return renameText(path)
}
