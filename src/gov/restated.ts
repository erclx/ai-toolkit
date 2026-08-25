import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The always-loaded file whose bullets are the subjects this sweep matches. */
export const INSTRUCTIONS_REL = 'CLAUDE.md'

/** The seed a target receives, authored from the file above. */
export const SEED_REL = join('tooling', 'claude', 'seeds', 'CLAUDE.md')

/** The shipped plugin bodies, which is where a rule restated in prose lands. */
export const SHIPPED_SKILLS_REL = join('claude', 'skills')

/**
 * Path pairs whose duplication is deliberate and already recorded.
 *
 * The seed is authored from the always-loaded file and `claude-seed-sync`
 * exists to reconcile the two, so a bullet appearing in both is the design
 * rather than a defect. Excluding by pair rather than by content is what the
 * plan settled on: the duplication is a location fact this repository already
 * records, and a content test would have to rediscover it on every run.
 *
 * The exclusion reaches a repetition alone. A mirror that disagrees is the one
 * shape the pairing cannot absorb, since the two files are meant to agree, so
 * a polarity split on a declared pair stays a finding.
 */
const MIRRORS: readonly (readonly [string, string])[] = [
  [INSTRUCTIONS_REL, SEED_REL],
]

/**
 * A token appearing in more than this many statements carries no signal.
 *
 * Under one percent of the 2750 statements this repository offers. Tuned
 * against that corpus rather than reasoned to, which is what the plan asked of
 * the first run: `.claude/plans/` sits at 14 and is the anchor the motivating
 * case turns on, while `file` sits at 371 and matches most of the tree.
 */
export const COMMON_CEILING = 20

/** Weight two statements must share before they are read as one rule. */
export const ANCHOR_FLOOR = 3

/**
 * What a backticked token is worth against a plain word.
 *
 * An author marking a span as code named an identifier rather than describing
 * one, so `.claude/plans/archive/` says more about what a statement governs
 * than any two prose words do. Weighting it is what lets the floor rise high
 * enough to drop a coincidental word pair without losing a rule two surfaces
 * spelled entirely differently around one shared path.
 */
const SPAN_WEIGHT = 2

/**
 * Weight a match needs before a polarity split is called a contradiction.
 *
 * Above the match floor on purpose. A thin match says two statements touch the
 * same subject, which is not enough to claim one forbids what the other
 * prescribes, so a weak pair reports as a repetition and the loudest class is
 * reserved for a pair sharing real identity.
 */
export const CONTRADICTION_FLOOR = 5

/**
 * Words carrying no subject, dropped before anchors are counted.
 *
 * Short rather than exhaustive. The document-frequency ceiling above removes
 * the rest on its own, and a hand-written list long enough to do that job
 * would be a second corpus nobody maintains.
 */
const STOPWORDS = new Set([
  'about',
  'after',
  'against',
  'already',
  'also',
  'and',
  'any',
  'are',
  'because',
  'been',
  'before',
  'being',
  'both',
  'but',
  'can',
  'each',
  'either',
  'else',
  'every',
  'for',
  'from',
  'has',
  'have',
  'her',
  'here',
  'his',
  'how',
  'into',
  'its',
  'itself',
  'more',
  'most',
  'much',
  'must',
  'once',
  'one',
  'only',
  'other',
  'our',
  'out',
  'over',
  'own',
  'per',
  'rather',
  'same',
  'she',
  'should',
  'since',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'too',
  'under',
  'until',
  'upon',
  'very',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whose',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
])

/**
 * Markers reading as a prohibition, which is the one polarity signal available
 * without understanding the sentence.
 *
 * Deliberately narrow. `no` and `not` are excluded because both appear inside
 * ordinary qualifying clauses, and widening the set turns most of the corpus
 * into a suspected contradiction.
 */
const PROHIBITIONS = ['never', 'do not', "don't", 'avoid', 'refuse']

export type RestatedRefusal = 'no-instructions' | 'no-surfaces'

export type Restatement = 'mirror' | 'repetition' | 'contradiction'

/** Which surface a restatement was found on, before any class is assigned. */
export type SurfaceKind = 'seed' | 'skill'

/**
 * Which surface a later edit starts from.
 *
 * `unknown` is a first-class answer rather than a gap. The content-ownership
 * table assigns a cross-domain rule and a domain-triggered one, and reaches
 * nothing stated in a skill body the always-loaded file never names, so
 * guessing there would put a reader on a surface nobody decided.
 */
export type Authority = 'claude-md' | 'skill-body' | 'unknown'

export interface Statement {
  /** Repository-relative, so a record reads the same from any working root. */
  readonly file: string
  /** One-based, matching the `file:line` form a reader clicks. */
  readonly line: number
  readonly text: string
}

export interface Surface extends Statement {
  readonly kind: SurfaceKind
  readonly restatement: Restatement
  /** The distinctive tokens this match rested on, so a finding is auditable. */
  readonly anchors: readonly string[]
  /** Those anchors scored, with a backticked one counting double. */
  readonly weight: number
  readonly authority: Authority
  /** Why the class and the authority read the way they do. */
  readonly reason: string
}

export interface RestatedEntry {
  readonly subject: Statement
  readonly surfaces: readonly Surface[]
}

export interface RestatedCounts {
  readonly contradictions: number
  readonly repetitions: number
  readonly mirrors: number
  /** Subjects carried by two further surfaces, which is the title's count. */
  readonly threeSurface: number
}

export type RestatedReport =
  | {
      readonly kind: 'measured'
      readonly corpus: {
        readonly instructions: number
        readonly seed: number
        readonly bodies: number
        /** Statements the two further surfaces offered, which bounds recall. */
        readonly candidates: number
      }
      readonly matcher: {
        readonly anchors: number
        readonly common: number
        readonly contradiction: number
      }
      readonly restatements: readonly RestatedEntry[]
      readonly counts: RestatedCounts
    }
  | { readonly kind: 'unreadable'; readonly reason: RestatedRefusal }

interface Candidate extends Statement {
  readonly kind: SurfaceKind
  /** The skill folder this statement sits in, present on a body alone. */
  readonly skill?: string
}

export interface Analysis {
  readonly tokens: ReadonlySet<string>
  /** The subset an author backticked, which weighs more than a plain word. */
  readonly spans: ReadonlySet<string>
}

/** A statement paired with the tokens it carries. */
interface Indexed<T extends Statement> {
  readonly statement: T
  readonly analysis: Analysis
}

/**
 * Splits text into the tokens an anchor can be drawn from.
 *
 * A code span keeps its inner text whole, since `.claude/plans/archive/` is the
 * strongest anchor this corpus offers and splitting it on the punctuation would
 * leave three words every second bullet also carries.
 */
export function analyze(text: string): Analysis {
  const spans: string[] = []
  const withoutSpans = text.replace(/`([^`]+)`/g, (_match, inner: string) => {
    spans.push(inner.toLowerCase())
    return ' '
  })

  const words = withoutSpans
    .toLowerCase()
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2')
    .split(/[^a-z0-9/._<>-]+/)
    .map((word) => word.replace(/^[-._/]+|[-._/,;:]+$/g, ''))

  const keep = (token: string): boolean =>
    token.length >= 3 && !STOPWORDS.has(token)

  return {
    tokens: new Set([...spans, ...words].filter(keep)),
    spans: new Set(spans.filter(keep)),
  }
}

function prohibits(text: string): boolean {
  const lowered = text.toLowerCase()
  return PROHIBITIONS.some((marker) => lowered.includes(marker))
}

function isMirrorPair(subject: string, surface: string): boolean {
  return MIRRORS.some(
    ([left, right]) =>
      (subject === left && surface === right) ||
      (subject === right && surface === left),
  )
}

/**
 * Bullets at the top level of a markdown file, which is the unit an instruction
 * takes in the always-loaded file and in the seed.
 */
function readBullets(root: string, relative: string): Statement[] {
  const full = join(root, relative)
  if (!existsSync(full)) return []

  const statements: Statement[] = []
  let fenced = false

  readFileSync(full, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (line.trimStart().startsWith('```')) {
        fenced = !fenced
        return
      }
      if (fenced || !line.startsWith('- ')) return

      statements.push({
        file: relative.replaceAll('\\', '/'),
        line: index + 1,
        text: line.slice(2).trim(),
      })
    })

  return statements
}

/**
 * Every prose line and bullet in a shipped body.
 *
 * Wider than the bullet rule above because the motivating case was stated in a
 * body as a paragraph, so a bullet-only read would miss the one instance this
 * sweep exists for. Headings, tables, and fenced blocks are read past: a
 * heading names a section rather than stating a rule, and a fenced block is an
 * example whose words are the surrounding prose's by construction.
 */
function readBodyLines(root: string, skillsRoot: string): Candidate[] {
  const candidates: Candidate[] = []

  const files = [
    ...new Bun.Glob('*/SKILL.md').scanSync({
      cwd: skillsRoot,
      onlyFiles: true,
    }),
  ].sort()

  for (const file of files) {
    const posix = file.replaceAll('\\', '/')
    const skill = posix.split('/')[0]
    const relative = `${SHIPPED_SKILLS_REL.replaceAll('\\', '/')}/${posix}`

    const lines = readFileSync(join(root, relative), 'utf8').split('\n')
    let fenced = false
    let frontmatter = lines[0]?.trim() === '---'

    for (const [index, line] of lines.entries()) {
      const trimmed = line.trim()

      // Frontmatter is metadata rather than instruction, and every body's
      // `description` restates that skill's own purpose, so sweeping it makes
      // each skill match any subject naming its domain.
      if (frontmatter) {
        if (index > 0 && trimmed === '---') frontmatter = false
        continue
      }

      if (trimmed.startsWith('```')) {
        fenced = !fenced
        continue
      }
      if (fenced || trimmed === '') continue
      if (trimmed.startsWith('#') || trimmed.startsWith('|')) continue
      if (trimmed.startsWith('---')) continue

      candidates.push({
        file: relative,
        line: index + 1,
        text: trimmed.replace(/^[-*>]\s+/, ''),
        kind: 'skill',
        skill,
      })
    }
  }

  return candidates
}

/** How many statements each token appears in, which is what rarity is read off. */
function documentFrequency(
  groups: readonly (readonly Indexed<Statement>[])[],
): Map<string, number> {
  const frequency = new Map<string, number>()

  for (const group of groups) {
    for (const entry of group) {
      for (const token of entry.analysis.tokens) {
        frequency.set(token, (frequency.get(token) ?? 0) + 1)
      }
    }
  }

  return frequency
}

function index<T extends Statement>(statement: T): Indexed<T> {
  return { statement, analysis: analyze(statement.text) }
}

/**
 * Which surface a later edit starts from, and why.
 *
 * A skill body earns authority only where the subject names that skill, which
 * is the content-ownership table's rule that behavior triggered when editing
 * domain X belongs to X's skill. Everything else the table does not reach is
 * reported as unknown.
 */
function authorityFor(
  subject: Statement,
  candidate: Candidate,
): { authority: Authority; reason: string } {
  if (candidate.kind === 'seed') {
    return {
      authority: 'claude-md',
      reason: `${INSTRUCTIONS_REL} is authored first and the seed carries it to a target, so an edit starts there and reaches the seed through claude-seed-sync`,
    }
  }

  if (
    candidate.skill !== undefined &&
    subject.text.toLowerCase().includes(candidate.skill.toLowerCase())
  ) {
    return {
      authority: 'skill-body',
      reason: `the subject names ${candidate.skill}, and behavior triggered only when editing one domain belongs to that domain's skill`,
    }
  }

  return {
    authority: 'unknown',
    reason:
      'the content-ownership table assigns a cross-domain rule and a domain-triggered one, and reaches neither from here',
  }
}

function classify(
  subject: Statement,
  candidate: Candidate,
  weight: number,
): { restatement: Restatement; reason: string } {
  const split = prohibits(subject.text) !== prohibits(candidate.text)

  if (split && weight >= CONTRADICTION_FLOOR) {
    return {
      restatement: 'contradiction',
      reason:
        'one surface states this as a prohibition and the other does not, which is a polarity reading rather than a judgment about meaning',
    }
  }

  if (isMirrorPair(subject.file, candidate.file)) {
    return {
      restatement: 'mirror',
      reason:
        'both files sit on a declared mirror pair, where repeating the rule is the design',
    }
  }

  return {
    restatement: 'repetition',
    reason: split
      ? 'the prohibition falls on one surface alone, on a match too thin to read that as a disagreement'
      : 'two surfaces state one rule and neither is declared a copy of the other',
  }
}

/**
 * Every instruction in the always-loaded file that a second surface also states.
 *
 * Matching is recall-first, keyed on distinctive tokens two statements share
 * rather than on a phrase they spell the same way. The motivating case was one
 * rule written three different ways, so a near-exact matcher would miss the
 * defect the sweep exists for, and a recall-first reading can be narrowed from
 * real output where the reverse cannot.
 *
 * It reports and never gates. A restatement is legitimate more often than not,
 * so a push failing on one would fail on the ordinary case.
 */
export function readRestated(root: string): RestatedReport {
  const instructions = readBullets(root, INSTRUCTIONS_REL)
  if (instructions.length === 0) {
    return { kind: 'unreadable', reason: 'no-instructions' }
  }

  const seed: Candidate[] = readBullets(root, SEED_REL).map((statement) => ({
    ...statement,
    kind: 'seed' as const,
  }))

  const skillsRoot = join(root, SHIPPED_SKILLS_REL)
  const bodies = existsSync(skillsRoot) ? readBodyLines(root, skillsRoot) : []

  const bodyFiles = new Set(bodies.map((candidate) => candidate.file)).size
  if (seed.length === 0 && bodies.length === 0) {
    return { kind: 'unreadable', reason: 'no-surfaces' }
  }

  const subjects = instructions.map(index)
  const candidates = [...seed, ...bodies].map(index)
  const frequency = documentFrequency([subjects, candidates])

  const distinctive = (analysis: Analysis): Set<string> =>
    new Set(
      [...analysis.tokens].filter(
        (token) => (frequency.get(token) ?? 0) <= COMMON_CEILING,
      ),
    )

  // Every candidate's rare set is invariant across the subject loop, so it is
  // built once here rather than per pair. The corpora multiply out to hundreds
  // of thousands of pairings, and rebuilding a set inside that is the shape
  // `.claude/rules/core/040-performance.md` names.
  const rareCandidates = candidates.map((candidate) => ({
    ...candidate,
    rare: distinctive(candidate.analysis),
  }))

  const restatements: RestatedEntry[] = []
  let contradictions = 0
  let repetitions = 0
  let mirrors = 0
  let threeSurface = 0

  for (const subject of subjects) {
    const rare = distinctive(subject.analysis)
    const surfaces: Surface[] = []

    for (const candidate of rareCandidates) {
      const shared = [...candidate.rare]
        .filter((token) => rare.has(token))
        .sort()

      const weight = shared.reduce(
        (total, token) =>
          total +
          (subject.analysis.spans.has(token) &&
          candidate.analysis.spans.has(token)
            ? SPAN_WEIGHT
            : 1),
        0,
      )

      if (weight < ANCHOR_FLOOR) continue

      const { restatement, reason } = classify(
        subject.statement,
        candidate.statement,
        weight,
      )
      const { authority, reason: why } = authorityFor(
        subject.statement,
        candidate.statement,
      )

      surfaces.push({
        file: candidate.statement.file,
        line: candidate.statement.line,
        text: candidate.statement.text,
        kind: candidate.statement.kind,
        restatement,
        anchors: shared,
        weight,
        authority,
        reason: `${reason}; ${why}`,
      })
    }

    if (surfaces.length === 0) continue

    for (const surface of surfaces) {
      if (surface.restatement === 'contradiction') contradictions += 1
      else if (surface.restatement === 'mirror') mirrors += 1
      else repetitions += 1
    }

    // Every surface counts here, a declared mirror included. The motivating
    // case was the always-loaded file, the seed, and a body, so dropping the
    // mirror would read that exact shape as a rule stated twice. The mirror
    // exclusion is a rule about which class is a finding, not about how far an
    // instruction reached.
    if (surfaces.length >= 2) threeSurface += 1

    restatements.push({ subject: subject.statement, surfaces })
  }

  return {
    kind: 'measured',
    corpus: {
      instructions: instructions.length,
      seed: seed.length,
      bodies: bodyFiles,
      candidates: candidates.length,
    },
    matcher: {
      anchors: ANCHOR_FLOOR,
      common: COMMON_CEILING,
      contradiction: CONTRADICTION_FLOOR,
    },
    restatements,
    counts: { contradictions, repetitions, mirrors, threeSurface },
  }
}
