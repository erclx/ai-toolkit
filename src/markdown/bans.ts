import { readFile } from 'node:fs/promises'
import { linesOutsideFences } from '@/markdown/scan'
import { resolveStandard } from '@/standards/read'

/**
 * Headings the two standards state their closed sets under.
 *
 * Each standard says where its own bans sit and points at the other for the
 * rest, so discovery anchors on the heading rather than on a bullet's position.
 * A section renamed empties the set loudly at the report's legend, where a
 * position-based read would narrow the check and still print a count.
 */
export const WORD_BAN_HEADING = '## Language'
export const CHARACTER_BAN_HEADING = '## Punctuation'

/** Bullet lead-ins the two closed sets are stated behind. */
const BAN_LEAD = '- Do not use '
const SPELLING_LEAD = '- Use American English spelling'

const BACKTICKED = /`([^`]+)`/g
const WORD = /^[a-z]+$/
const SUFFIX = /^-[a-z]+$/

export interface BanReport {
  /** Single characters the mechanics standard bans outright. */
  readonly characters: readonly string[]
  /** Single lowercase words the prose standard bans outright. */
  readonly words: readonly string[]
  /** Spellings derived from the prose standard's own examples. */
  readonly spellings: readonly string[]
  /**
   * Paths of the standards read, in the order read. Repo-relative for a project
   * copy, and spelled under `<aitk>/` for the package copy, so a reader can
   * tell which root answered without joining a path that resolves nowhere.
   */
  readonly sources: readonly string[]
  /**
   * Standards that resolved under none of the roots. Absent is a distinct state
   * from empty: a scan with no terms finds nothing, and reporting that as a
   * clean file claims the prose passed when nothing was looked for.
   */
  readonly missing: readonly string[]
}

function section(markdown: string, heading: string): string[] {
  const lines = linesOutsideFences(markdown)
  const start = lines.findIndex((line) => line.trim() === heading)
  if (start === -1) return []

  const body = lines.slice(start + 1)
  const end = body.findIndex((line) => line.startsWith('## '))

  return end === -1 ? body : body.slice(0, end)
}

function backticked(line: string): string[] {
  return [...line.matchAll(BACKTICKED)].map((match) => match[1].trim())
}

/**
 * Pulls the single lowercase words out of the `Do not use` bullets.
 *
 * A multi-word term is left out rather than matched loosely. The standard bans
 * a pattern like `It's not X, it's Y` with a placeholder standing in for the
 * rest of the sentence, and no literal match reaches it, so the phrase bans
 * stay a reader's judgment and the report names them as unmeasured.
 */
export function parseWordBans(markdown: string): string[] {
  const terms: string[] = []

  for (const line of section(markdown, WORD_BAN_HEADING)) {
    if (!line.startsWith(BAN_LEAD)) continue
    for (const term of backticked(line)) {
      if (WORD.test(term) && !terms.includes(term)) terms.push(term)
    }
  }

  return terms
}

/**
 * Pulls the single non-alphanumeric characters out of the `Do not use` bullets.
 *
 * Width is what separates the two ban classes in that section. The character
 * bans are stated as one glyph each, and the parenthetical-aside ban quotes a
 * whole clause, which is a shape no literal match should be built from.
 */
export function parseCharacterBans(markdown: string): string[] {
  const terms: string[] = []

  for (const line of section(markdown, CHARACTER_BAN_HEADING)) {
    if (!line.startsWith(BAN_LEAD)) continue
    for (const term of backticked(line)) {
      if (
        term.length === 1 &&
        !/[a-z0-9]/i.test(term) &&
        !terms.includes(term)
      ) {
        terms.push(term)
      }
    }
  }

  return terms
}

/**
 * Derives the banned spellings by applying the standard's own suffix rules to
 * the standard's own examples.
 *
 * The spelling rule is stated as a preference with examples rather than as a
 * closed set, and a suffix pattern run over prose is what produced 46 of the
 * 58 false positives measured during intake: `exercises`, `promises`, and
 * `revised` all end in `-ise` and none is a British spelling. Transforming the
 * listed American words into their British forms yields a closed set that
 * matches whole words and reaches none of them, and an example added to the
 * standard extends the check without a code edit.
 */
export function parseSpellingBans(markdown: string): string[] {
  const line = section(markdown, WORD_BAN_HEADING).find((each) =>
    each.startsWith(SPELLING_LEAD),
  )
  if (!line) return []

  const terms = backticked(line)
  const suffixes = terms.filter((term) => SUFFIX.test(term))
  const examples = terms.filter((term) => WORD.test(term))

  // Stated as `preferred` over `banned`, so the run of suffix terms pairs off
  // in order. An odd count means the sentence was rewritten into a shape this
  // cannot read, and pairing what is there would invent a rule from half of it.
  if (suffixes.length === 0 || suffixes.length % 2 !== 0) return []

  const pairs: { preferred: string; banned: string }[] = []
  for (let index = 0; index < suffixes.length; index += 2) {
    pairs.push({
      preferred: suffixes[index].slice(1),
      banned: suffixes[index + 1].slice(1),
    })
  }

  const spellings: string[] = []
  for (const example of examples) {
    const pair = pairs.find((each) => example.endsWith(each.preferred))
    if (!pair) continue

    const banned = `${example.slice(0, -pair.preferred.length)}${pair.banned}`
    if (!spellings.includes(banned)) spellings.push(banned)
  }

  return spellings
}

export interface StandardText {
  /** Path of the copy read, so a report says which root won. */
  readonly source: string
  readonly text: string
}

export interface Standards {
  readonly markdown: StandardText | undefined
  readonly prose: StandardText | undefined
  /**
   * Standards that resolved under none of the roots. Absent is a distinct state
   * from empty: a scan with no terms finds nothing, and reporting that as a
   * clean file claims the prose passed when nothing was looked for.
   */
  readonly missing: readonly string[]
}

async function loadStandard(
  root: string,
  name: string,
): Promise<StandardText | undefined> {
  const resolved = resolveStandard(root, name)
  if (!resolved) return undefined

  return {
    source: resolved.source,
    text: await readFile(resolved.path, 'utf8'),
  }
}

/**
 * Finds both standards, so one read serves the ban sets and the checkpoints.
 *
 * The texts are returned rather than the parsed sets alone because
 * `structure.ts` reads its numbers out of the same `markdown.md`, and a second
 * loader would open the file twice and could resolve a different root than
 * this one did.
 */
export async function loadStandards(root: string): Promise<Standards> {
  const [markdown, prose] = await Promise.all([
    loadStandard(root, 'markdown.md'),
    loadStandard(root, 'prose.md'),
  ])

  return {
    markdown,
    prose,
    missing: [
      markdown ? undefined : 'markdown.md',
      prose ? undefined : 'prose.md',
    ].filter((name): name is string => name !== undefined),
  }
}

/**
 * Reads both closed sets out of the standards stating them.
 *
 * Holding the lists in code was the alternative and it puts the bans in two
 * places, where an author adding a banned word gets no enforcement until
 * someone edits TypeScript. The trade is a reader of prose that a reformat can
 * break, which `bans.test.ts` answers by asserting the parsed sets against the
 * shipped standards.
 */
export function banReport(standards: Standards): BanReport {
  const { markdown, prose } = standards

  return {
    characters: markdown ? parseCharacterBans(markdown.text) : [],
    words: prose ? parseWordBans(prose.text) : [],
    spellings: prose ? parseSpellingBans(prose.text) : [],
    sources: [markdown?.source, prose?.source].filter(
      (source): source is string => source !== undefined,
    ),
    missing: standards.missing,
  }
}

export async function loadBans(root: string): Promise<BanReport> {
  return banReport(await loadStandards(root))
}
