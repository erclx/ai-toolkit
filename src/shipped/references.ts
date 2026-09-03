import { isMarked } from '@/exempt-marker'

/**
 * The corpora a target reader reaches, which is the `files` field less `src`.
 *
 * The field is the statement of what leaves this repository, and `src/secrets/
 * shipped.ts` reads it directly for the credential sweep. This list is narrower
 * on purpose rather than by omission. What decides membership here is whether
 * anything serves the file to a reader who does not hold this repository: a
 * skill body loads into a session, a docs page is read through `canon docs`, a
 * standard through `canon standards`, a rule through a glob match, a snippet
 * through an `@` expansion, and a seed through an install. A `src/` doc comment
 * is read by someone working on the toolkit, in this checkout, where every
 * number resolves.
 *
 * That is also what keeps the check a prose pattern rather than a parser.
 * `src/design/base.css` and `src/design/tokens.ts` carry sixteen values shaped
 * `#191512`, which no width or boundary rule separates from a pull request
 * number, so telling them apart would need the line's syntactic position.
 *
 * `claude/standards` and `claude/snippets` are symlinks into two of the roots
 * below, and a walk that followed them would read those two corpora twice and
 * report every finding in them under two paths. Nothing is lost by not
 * following, since both are corpora here in their own right.
 */
export const SHIPPED_CORPORA = [
  'claude',
  'docs',
  'governance',
  'scripts',
  'snippets',
  'standards',
  'tooling',
] as const

/**
 * Trees inside a corpus above that no target receives, matching the negations
 * the `files` field already makes. A number under either names something its
 * only reader can already resolve.
 */
export const SHIPPED_EXCLUSIONS = [
  /^scripts\/sandbox\//,
  /^scripts\/eval\//,
] as const

/** Whether a repository-relative path sits in the gated corpus. */
export function isShippedCorpus(path: string): boolean {
  if (SHIPPED_EXCLUSIONS.some((pattern) => pattern.test(path))) return false
  if (path.endsWith('.test.ts')) return false

  return SHIPPED_CORPORA.some((corpus) => path.startsWith(`${corpus}/`))
}

export const REFERENCE_MARKER = 'canon-allow-reference'

/**
 * A pull request number a target reader resolves against their own repository.
 *
 * The leading boundary is what excludes the repair form by construction rather
 * than by exemption, and that is load bearing. A lookbehind rejecting a word
 * character before `#` never matches `erclx/canon#1299`, so a qualified
 * reference passes with no marker, and `claude/skills/claude-worktree/SKILL.md`
 * already ships `anthropics/claude-code#58345` in exactly that form.
 *
 * The trailing boundary is what the first shape of this pattern lacked, and it
 * costs a live finding to omit. `governance/rules/framework/250-tailwind.md`
 * writes `bg-[#316ff6]`, a Tailwind arbitrary hex color, which an unbounded
 * `#[0-9]+` reads as pull request 316. Requiring a non-word character after the
 * digits rejects it and rejects nothing real, since a citation is always
 * followed by a space, a backtick, or punctuation.
 *
 * Any digit run counts. This repository is past `#1300` so a four-digit pattern
 * reads as complete, and `#1`, `#12`, and `#123` all resolve to the wrong thing
 * in a target just as surely.
 */
const PULL_REQUEST = /(?<![0-9A-Za-z_])#([0-9]+)(?![0-9A-Za-z_])/g

/**
 * A commit sha, which is the worse half: it resolves to nothing anywhere rather
 * than to the wrong pull request.
 *
 * Seven characters is git's own short-sha floor and forty is a full one. No
 * rule here requires a letter, because an all-digit sha is real:
 * `orchestrator-poll.md` cites `5653721`, and the first pass at this classifier
 * required a letter and lost it.
 *
 * The lookbehind rejects `@` and `/` so the repair form `erclx/canon@5653721`
 * passes the check that told the author to write it, and rejects `#` so a hex
 * color long enough to reach the floor is not reported twice under two names.
 *
 * Three false-positive classes survive by construction and the marker is what
 * answers each. An all-digit hex color is indistinguishable from a pull request
 * number. A seven-letter word spelled from `a` through `f` alone, such as
 * `defaced`, reads as a sha. Neither occurs anywhere in the corpus today.
 *
 * The third is the one a later author meets. Admitting an all-digit sha admits
 * every run of seven or more decimal digits with it, so a date written without
 * separators, a large count, or a float artifact reads as a commit reference.
 * The corpus carries no instance and that is the exclusions rather than luck:
 * twelve such runs sit under the seven roots, eleven of them under
 * `scripts/sandbox/`, `scripts/eval/`, or a test file, and the twelfth is the
 * genuine sha in `orchestrator-poll.md`. Write a seven-digit measurement into a
 * shipped page and the push fails on it, which the marker answers and no
 * narrowing can, since requiring a letter loses the all-digit sha above.
 */
const COMMIT_SHA = /(?<![0-9A-Za-z_@/#])([0-9a-f]{7,40})(?![0-9A-Za-z_])/g

/**
 * A same-repository citation, qualified or not. Qualifying `#123` or a sha
 * against `erclx/canon` is the repair `PULL_REQUEST` and `COMMIT_SHA` above
 * read as the fix, and it fixes nothing here: a reader holding only the
 * plugin cache or the published package still cannot open this repository's
 * own history, so the qualified form resolves exactly as badly as the bare
 * one.
 *
 * The literal is hardcoded rather than read from `package.json` or
 * `git remote`, matching `src/github-format.ts` and `src/commands/repo.ts`,
 * which already hardcode it.
 *
 * Same word-boundary discipline as the two patterns above: a word character
 * ahead of `erclx` would mean this match is a suffix of some other token, and
 * a word character behind the digits would mean the citation continues past
 * what was captured.
 */
const SAME_REPOSITORY =
  /(?<![0-9A-Za-z_/])erclx\/canon(#[0-9]+|@[0-9a-f]{7,40})(?![0-9A-Za-z_])/g

export interface ShippedReference {
  readonly file: string
  /** One-based, matching the `file:line` form a reader clicks. */
  readonly line: number
  readonly kind: 'pull-request' | 'commit'
  /** The reference as written, so a report names the token to qualify. */
  readonly text: string
  /**
   * Set only for a citation of this repository's own history. Qualifying it
   * is not the fix `kind` alone would suggest, so a caller reads this before
   * choosing a remedy.
   */
  readonly selfCitation?: true
}

/**
 * Every reference in one shipped file that no marker mutes.
 *
 * The corpus walk is deliberately absent, which lets the shape be tested
 * against a string rather than against a fixture. That is the seam
 * `headingCitationsIn` draws in `src/claude/skills-headings.ts` and `citationsIn`
 * draws in `skills-reach.ts`.
 *
 * The unit is the match rather than the line, unlike those two, because one
 * line here can carry three separate tokens each needing its own repair and a
 * report naming the line once leaves two of them unsaid.
 *
 * `isMarked` reads the line itself and the line above and stops there, so the
 * marker mutes a line and nothing narrower. A real citation later added beside
 * a marked illustration ships unreported.
 */
export function referencesIn(file: string, text: string): ShippedReference[] {
  const lines = text.split('\n')
  const references: ShippedReference[] = []

  for (const [index, line] of lines.entries()) {
    if (isMarked(lines, index, REFERENCE_MARKER)) continue

    for (const match of line.matchAll(PULL_REQUEST)) {
      references.push({
        file,
        line: index + 1,
        kind: 'pull-request',
        text: match[0],
      })
    }

    for (const match of line.matchAll(COMMIT_SHA)) {
      references.push({
        file,
        line: index + 1,
        kind: 'commit',
        text: match[0],
      })
    }

    for (const match of line.matchAll(SAME_REPOSITORY)) {
      references.push({
        file,
        line: index + 1,
        kind: match[1]?.startsWith('#') ? 'pull-request' : 'commit',
        text: match[0],
        selfCitation: true,
      })
    }
  }

  return references
}
