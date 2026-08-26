import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { listSkills } from '@/claude/skills-list'

/**
 * Whether a prompt reaches the right skill, measured by TF-IDF cosine
 * similarity over the shipped catalog's own frontmatter descriptions. This is
 * a necessary condition rather than a report of real routing behavior: it
 * asks whether the descriptions are separable by the words they use, and
 * Claude Code does not route this way.
 *
 * Ported from `.claude/groundwork/42-ai-blueprint/evidence/rank.ts`, which
 * ran once against this catalog and named the collisions this measure now
 * tracks on a cadence.
 */

const SKILLS_DIR = join('claude', 'skills')

const STOP = new Set(
  'a about after again all also and any are as at be before but by can do does for from has have help how in into is it its just make not of on or our so that the then there these this to use used uses using want was what when where which who why with you your run'.split(
    ' ',
  ),
)

export interface RankedSkill {
  readonly name: string
  readonly description: string
}

/** One prompt and the skill it should reach. */
export interface SkillCase {
  readonly prompt: string
  readonly expect: string
}

/** A case whose prompt did not rank its expected skill first. */
export interface Miss {
  readonly prompt: string
  readonly expect: string
  /** The skill the ranker placed first instead. */
  readonly won: string
  /** Where `expect` placed, or 0 when it never appears in the catalog. */
  readonly rank: number
}

/** Why a measure produced no reading, which is never the same as a clean one. */
export type RankRefusal = 'no-skills'

export type RankReport =
  | {
      readonly kind: 'measured'
      readonly skills: number
      readonly cases: number
      readonly rank1: number
      readonly top3: number
      readonly misses: readonly Miss[]
      /** Cases whose prompt carried no vocabulary to score. */
      readonly unmeasurable: readonly SkillCase[]
    }
  | { readonly kind: 'refused'; readonly reason: RankRefusal }

/**
 * Every shipped skill's frontmatter description, read the way a prompt is
 * matched against it: whole, including the quoted trigger phrases it states.
 * A skill whose frontmatter carries no description contributes no vocabulary
 * and never wins a rank, so it is dropped rather than scored on nothing.
 */
export function loadCatalog(root: string): RankedSkill[] {
  return listSkills(root)
    .filter((skill) => skill.description !== '')
    .map((skill) => ({ name: skill.name, description: skill.description }))
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token))
}

function termCounts(tokens: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1)
  return counts
}

function buildIdf(
  docs: readonly Map<string, number>[],
): (term: string) => number {
  const total = docs.length
  const documentFrequency = new Map<string, number>()
  for (const doc of docs) {
    for (const term of doc.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    }
  }
  return (term) =>
    Math.log((total + 1) / ((documentFrequency.get(term) ?? 0) + 1)) + 1
}

function tfIdfVector(
  terms: Map<string, number>,
  idf: (term: string) => number,
): Map<string, number> {
  const vec = new Map<string, number>()
  for (const [term, frequency] of terms) vec.set(term, frequency * idf(term))
  return vec
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dot = 0
  for (const [term, weight] of a) dot += weight * (b.get(term) ?? 0)
  if (dot === 0) return 0

  const norm = (vec: Map<string, number>) =>
    Math.sqrt(
      [...vec.values()].reduce((sum, weight) => sum + weight * weight, 0),
    )
  const denominator = norm(a) * norm(b)
  return denominator === 0 ? 0 : dot / denominator
}

export interface RankedResult {
  readonly name: string
  readonly score: number
}

/**
 * Every skill's TF-IDF vector over the catalog it was loaded with, and the
 * IDF weighting that both the catalog and a scored prompt read from. A model
 * is built once per catalog and reused across every case, since the IDF
 * weights are the same question asked of the same corpus each time.
 */
export interface RankModel {
  readonly rank: (prompt: string) => readonly RankedResult[]
}

export function buildModel(catalog: readonly RankedSkill[]): RankModel {
  const docs = catalog.map((skill) => termCounts(tokenize(skill.description)))
  const idf = buildIdf(docs)
  const vectors = new Map(
    catalog.map((skill, index) => [skill.name, tfIdfVector(docs[index], idf)]),
  )

  return {
    rank: (prompt: string): readonly RankedResult[] => {
      const promptVector = tfIdfVector(termCounts(tokenize(prompt)), idf)
      // A prompt built entirely from stopwords and short words tokenizes to
      // nothing, so every skill would score 0 and the sort would fall through
      // to `localeCompare`, handing the alphabetically first skill a win no
      // description earned. Reporting no ranking at all is what keeps that
      // tie-break from reading as a measurement.
      if (promptVector.size === 0) return []

      return [...vectors]
        .map(([name, vector]) => ({
          name,
          score: cosineSimilarity(promptVector, vector),
        }))
        .sort(
          (left, right) =>
            right.score - left.score || left.name.localeCompare(right.name),
        )
    },
  }
}

/**
 * Scores every case against the catalog's own descriptions, which is the
 * production mechanism: Claude Code matches a prompt against the whole
 * description a skill ships, triggers included.
 */
export function measureCases(
  catalog: readonly RankedSkill[],
  cases: readonly SkillCase[],
): {
  readonly rank1: number
  readonly top3: number
  readonly misses: readonly Miss[]
  readonly unmeasurable: readonly SkillCase[]
} {
  const model = buildModel(catalog)
  let rank1 = 0
  let top3 = 0
  const misses: Miss[] = []
  const unmeasurable: SkillCase[] = []

  for (const skillCase of cases) {
    const ranked = model.rank(skillCase.prompt)
    if (ranked.length === 0) {
      unmeasurable.push(skillCase)
      continue
    }

    const at = ranked.findIndex((entry) => entry.name === skillCase.expect) + 1

    if (at === 1) rank1 += 1
    if (at > 0 && at <= 3) top3 += 1
    if (at !== 1) {
      misses.push({
        prompt: skillCase.prompt,
        expect: skillCase.expect,
        won: ranked[0]?.name ?? '',
        rank: at,
      })
    }
  }

  return { rank1, top3, misses, unmeasurable }
}

/**
 * Reads the shipped catalog off disk and scores it against the given case
 * corpus. Measures the cwd's catalog rather than the toolkit root, matching
 * the reach and audit verbs, so a linked worktree reads its own branch.
 */
export function scanRank(
  root: string,
  cases: readonly SkillCase[],
): RankReport {
  const skillsRoot = join(root, SKILLS_DIR)
  if (!existsSync(skillsRoot)) return { kind: 'refused', reason: 'no-skills' }

  const catalog = loadCatalog(root)
  const { rank1, top3, misses, unmeasurable } = measureCases(catalog, cases)

  return {
    kind: 'measured',
    skills: catalog.length,
    cases: cases.length,
    rank1,
    top3,
    misses,
    unmeasurable,
  }
}
