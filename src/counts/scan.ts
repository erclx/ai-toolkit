import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type Catalog, CATALOGS } from '@/counts/catalogs'
import { NUMBER_PATTERN, parseNumber } from '@/counts/numbers'
import { resolveMarkdown } from '@/markdown/files'

export interface CountFinding {
  readonly file: string
  readonly line: number
  readonly catalog: string
  readonly stated: number
  readonly actual: number
  readonly sentence: string
}

/**
 * Narrower than `MarkdownAuditRefusal`. This sweep takes no path arguments,
 * so `resolveMarkdown` can never return its `no-match` reason here.
 */
export type CountsRefusal = 'no-git' | 'no-markdown'

export type CountsReport =
  | {
      readonly kind: 'measured'
      readonly filesScanned: number
      /**
       * The true count this run read for every catalog, keyed by id.
       * `undefined` for a catalog this tree carries nothing to count, which
       * `commands` is on every project but this repository.
       */
      readonly catalogs: Readonly<Record<string, number | undefined>>
      readonly findings: readonly CountFinding[]
    }
  | { readonly kind: 'unreadable'; readonly reason: CountsRefusal }

/**
 * A calendar date, which reads a sentence as a historical record rather than
 * a live claim about the tree. `.claude/ARCHITECTURE.md` and the context
 * entries carry a figure this way deliberately, and every one of them stays
 * correct forever, so a sentence carrying one is read past rather than
 * matched.
 */
const DATE = /\b\d{4}-\d{2}-\d{2}\b/

/** A commit-length hex token in a backtick span, the other marker of a dated record. */
const COMMIT = /`[0-9a-f]{7,12}`/

function isDated(sentence: string): boolean {
  return DATE.test(sentence) || COMMIT.test(sentence)
}

/**
 * Splits a rendered line into the sentences a reader sees.
 *
 * A markdown paragraph in this corpus is written as one long line rather than
 * hard-wrapped, so a line is routinely several sentences deep, and a date
 * naming one of them must not excuse a live claim two sentences away in the
 * same line.
 */
function sentencesOf(line: string): string[] {
  return line
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== '')
}

/**
 * A verb asserting the whole of something, immediately ahead of the number.
 *
 * The first design matched a bare number next to a catalog noun anywhere in
 * the tracked corpus, and running it here returned 290 findings against a
 * repository whose Files-to-touch names one live instance. Reading the
 * corpus behind that run showed why: `18 rules citing a standard`, `21 skill
 * bodies`, and `eight internal skills` all pair a number with a catalog noun
 * while naming a subset, an example, or a different catalog than the one
 * matched, and that shape dominates ordinary prose. Every instance this
 * module was written against reads the number as the direct object of a verb
 * asserting the catalog's own total, `the full entry loads 59 skills` being
 * the live one, and gating the match on that verb is what a full re-read of
 * the 290 showed removing all of them while keeping that one.
 */
const ASSERTION_VERBS = [
  'loads',
  'ships',
  'carries',
  'holds',
  'counts',
  'totals',
  'documents',
  'declares',
  'installs',
  'lists',
  'contains',
  'comprises',
]

/**
 * Matches a catalog's stated size: an assertion verb, the number, an optional
 * single qualifying word, then the noun in either number.
 *
 * The optional word between the number and the noun is what reaches a form
 * like `installs 11 shipped snippets` without also reaching past an
 * intervening clause, since a wider gap would start pairing a number in one
 * clause with a noun in the next. Requiring the noun's own plural form to
 * double as its match narrows the corpus this reads without hand-listing
 * every irregular plural, since none of these six is irregular.
 *
 * What this drops along with the false positives: `denominator of sixty-one
 * shipped skills` and `exposed all 59` both state a real catalog total and
 * neither puts the verb directly ahead of the number, so both read past. The
 * gap between assertion and number is a second axis this could widen once the
 * verb-gated design has its own false-positive rate measured.
 */
function buildMatcher(catalog: Catalog): RegExp {
  const [singular, plural] = catalog.nouns
  const verbs = ASSERTION_VERBS.join('|')
  return new RegExp(
    `\\b(?:${verbs})\\s+(${NUMBER_PATTERN})(?:\\s+[a-z]+)?\\s+(?:${singular}|${plural})\\b`,
    'gi',
  )
}

const MATCHERS: readonly { catalog: Catalog; regex: RegExp }[] = CATALOGS.map(
  (catalog) => ({ catalog, regex: buildMatcher(catalog) }),
)

/**
 * A stated figure within a factor of two of the true count, in either
 * direction.
 *
 * The verb gate alone still passed a run against this repository at four
 * false positives to one real finding: `carries two rules about a
 * standard's own lifecycle`, `holds one rule or one fact`, and `documents
 * two similar commands` each pair an assertion verb with a catalog noun
 * used for something this tree's `rules` or `commands` catalog does not
 * mean. What tells those apart from the live finding is magnitude. A
 * catalog this sweep tracks drifts by a few members between the day a
 * sentence was written and the day it is read, so a genuine staleness claim
 * sits near the true count, and `2` beside a true count of `59` is not a
 * catalog that shrank, it is a different `rules` entirely.
 *
 * Tuned against the run this module was written against rather than
 * reasoned to from first principles, the way `restated.ts` tunes its own
 * document-frequency ceiling. Every catalog here sits in the tens, and the
 * bound is a property of that scale rather than a universal one.
 */
const PLAUSIBLE_RATIO = 0.5

function isPlausibleClaim(stated: number, actual: number): boolean {
  if (actual === 0) return stated === 0
  return (
    stated / actual >= PLAUSIBLE_RATIO && actual / stated >= PLAUSIBLE_RATIO
  )
}

/**
 * Scans every tracked markdown file for a sentence stating how many members
 * one of the closed catalogs holds, and compares the stated figure against
 * what the tree actually counts.
 *
 * What it does not measure: a delta phrased as a transition (`from fourteen
 * to fifteen`), a fraction (`thirteen of sixteen`), and a total reached
 * through an indirect noun (`denominator of sixty-one shipped skills`) are
 * all catalog-size claims this corpus carries, and none matches the
 * assertion-verb shape this reads. Each is a known gap rather than an
 * oversight, left for a wider pass once this one's false-positive rate is
 * measured.
 */
export async function scanCounts(root: string): Promise<CountsReport> {
  const scope = await resolveMarkdown(root, [])
  if (scope.kind === 'unavailable') {
    return { kind: 'unreadable', reason: 'no-git' }
  }
  if (scope.files.length === 0) {
    return { kind: 'unreadable', reason: 'no-markdown' }
  }

  const catalogs: Record<string, number | undefined> = {}
  for (const catalog of CATALOGS) catalogs[catalog.id] = catalog.count(root)

  const findings: CountFinding[] = []

  for (const file of scope.files) {
    const text = readFileSync(join(root, file), 'utf8')
    let fenced = false

    text.split('\n').forEach((line, index) => {
      if (line.trimStart().startsWith('```')) {
        fenced = !fenced
        return
      }
      if (fenced) return

      for (const sentence of sentencesOf(line)) {
        if (isDated(sentence)) continue

        for (const { catalog, regex } of MATCHERS) {
          regex.lastIndex = 0
          const match = regex.exec(sentence)
          if (match === null) continue

          const stated = parseNumber(match[1])
          if (stated === undefined) continue

          const actual = catalogs[catalog.id]
          // No true count on this tree, which is the ordinary state of the
          // `commands` catalog outside this repository. A stated figure has
          // nothing to be judged stale against.
          if (actual === undefined) continue
          if (stated === actual) continue
          if (!isPlausibleClaim(stated, actual)) continue

          findings.push({
            file,
            line: index + 1,
            catalog: catalog.id,
            stated,
            actual,
            sentence,
          })
        }
      }
    })
  }

  return {
    kind: 'measured',
    filesScanned: scope.files.length,
    catalogs,
    findings,
  }
}
