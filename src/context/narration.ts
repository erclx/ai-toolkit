import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * The headings a rule carries to publish the two sets.
 *
 * Discovery is anchored on these rather than on a filename for the reason
 * `src/comments/vocabulary.ts` anchors its own: governance rules are numbered,
 * and a renumber would empty the sets while the check kept reporting clean.
 * Both open with `Narration` so neither loader can read the other's list.
 */
export const PRONOUN_HEADING = '## Narration pronouns'
export const VERB_HEADING = '## Narration verbs'

/**
 * Roots searched in order. The installed copy wins over the toolkit source, so
 * a target project measures against the rule it actually has rather than one
 * only the toolkit carries.
 */
const RULE_ROOTS = ['.claude/rules', 'governance/rules']

export interface NarrationTerms {
  /** Back-reference openings, matched at the start of a bullet and cased. */
  readonly pronouns: readonly string[]
  /** Past-tense verbs, matched anywhere in the bullet and uncased. */
  readonly verbs: readonly string[]
}

/**
 * Absent is a distinct state from empty, the split the comment vocabulary
 * draws for the same reason: a scan with no terms finds nothing, and reporting
 * that as zero findings claims the corpus is clean when nothing was looked for.
 */
export type Narration =
  | ({ readonly kind: 'loaded'; readonly source: string } & NarrationTerms)
  | { readonly kind: 'absent' }

/** Pulls the backticked terms out of the bullets under one heading. */
export function parseTerms(
  markdown: string,
  heading: string,
): string[] | undefined {
  const lines = markdown.split('\n')
  const start = lines.findIndex((line) => line.trim() === heading)
  if (start === -1) return undefined

  const terms: string[] = []

  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break
    for (const match of line.matchAll(/`([^`]+)`/g)) {
      const term = match[1].trim()
      if (term && !terms.includes(term)) terms.push(term)
    }
  }

  return terms
}

/**
 * Finds the rule publishing both sets under `root`.
 *
 * Both come from one file rather than from whichever rule carries each. A
 * pronoun set and a verb set are halves of one signal, and pairing them across
 * files would let a renumber recombine them into a signal nobody wrote.
 */
export async function loadNarration(root: string): Promise<Narration> {
  for (const ruleRoot of RULE_ROOTS) {
    const dir = resolve(root, ruleRoot)
    if (!existsSync(dir)) continue

    const paths: string[] = []
    for await (const rel of new Bun.Glob('**/*.md').scan({
      cwd: dir,
      onlyFiles: true,
    })) {
      paths.push(rel)
    }
    paths.sort()

    for (const rel of paths) {
      const source = await readFile(resolve(dir, rel), 'utf8')
      const pronouns = parseTerms(source, PRONOUN_HEADING)
      const verbs = parseTerms(source, VERB_HEADING)

      if (pronouns && verbs && pronouns.length > 0 && verbs.length > 0) {
        return {
          kind: 'loaded',
          source: `${ruleRoot}/${rel}`,
          pronouns,
          verbs,
        }
      }
    }
  }

  return { kind: 'absent' }
}
