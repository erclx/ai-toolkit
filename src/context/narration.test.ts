import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  loadNarration,
  parseTerms,
  PRONOUN_HEADING,
  VERB_HEADING,
} from '@/context/narration'

let ROOT: string

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'canon-narration-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

const RULE = `# Context entry standards

## Before editing

- Rewrite the decision a change supersedes rather than appending a second one.

${PRONOUN_HEADING}

Do not open a bullet with one of these where the antecedent is the bullet above it.

- \`It\`, \`That\`, \`This\`

${VERB_HEADING}

- \`was\`, \`were\`, \`used to\`

## Authority

- Follow \`.claude/standards/context.md\`. It is the single source.
`

function seedRule(relativePath: string, text: string): void {
  const path = join(ROOT, relativePath)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, text)
}

describe('parseTerms', () => {
  it('should collect the backticked terms under the heading', () => {
    expect(parseTerms(RULE, PRONOUN_HEADING)).toEqual(['It', 'That', 'This'])
    expect(parseTerms(RULE, VERB_HEADING)).toEqual(['was', 'were', 'used to'])
  })

  it('should stop collecting at the next second-level heading', () => {
    // `.claude/standards/context.md` sits in a backticked span under the
    // following heading, so a walk that runs past the boundary reads it as a
    // verb and the set gains a term the rule never published.
    expect(parseTerms(RULE, VERB_HEADING)).not.toContain(
      '.claude/standards/context.md',
    )
  })

  it('should return undefined when the heading is absent', () => {
    expect(
      parseTerms('# Rule\n\n- A directive.\n', VERB_HEADING),
    ).toBeUndefined()
  })

  it('should return an empty set for a heading carrying no backticked term', () => {
    const text = `# Rule\n\n${VERB_HEADING}\n\nProse with no term.\n`

    expect(parseTerms(text, VERB_HEADING)).toEqual([])
  })
})

describe('loadNarration', () => {
  it('should read both sets and name the rule they came from', async () => {
    seedRule('governance/rules/claude/510-context.md', RULE)

    expect(await loadNarration(ROOT)).toEqual({
      kind: 'loaded',
      source: 'governance/rules/claude/510-context.md',
      pronouns: ['It', 'That', 'This'],
      verbs: ['was', 'were', 'used to'],
    })
  })

  it('should prefer the installed copy over the toolkit source', async () => {
    seedRule('governance/rules/claude/510-context.md', RULE)
    seedRule(
      '.claude/rules/claude/510-context.md',
      RULE.replace('`was`, `were`, `used to`', '`became`'),
    )

    const loaded = await loadNarration(ROOT)

    expect(loaded).toMatchObject({
      source: '.claude/rules/claude/510-context.md',
      verbs: ['became'],
    })
  })

  it('should report absent when no rule publishes either heading', async () => {
    seedRule('governance/rules/claude/510-context.md', '# Rule\n\n- One.\n')

    expect(await loadNarration(ROOT)).toEqual({ kind: 'absent' })
  })

  it('should report absent when a rule publishes only one of the two', async () => {
    // Half a signal is not a narrower signal, it is a different one. Scanning
    // on pronouns alone reports every back-reference in the corpus.
    const half = `# Rule\n\n${PRONOUN_HEADING}\n\n- \`It\`, \`That\`\n`
    seedRule('governance/rules/claude/510-context.md', half)

    expect(await loadNarration(ROOT)).toEqual({ kind: 'absent' })
  })

  it('should report absent when a published heading lists no term', async () => {
    const empty = `# Rule\n\n${PRONOUN_HEADING}\n\n- \`It\`\n\n${VERB_HEADING}\n\nProse.\n`
    seedRule('governance/rules/claude/510-context.md', empty)

    expect(await loadNarration(ROOT)).toEqual({ kind: 'absent' })
  })

  it('should report absent when neither rule root exists', async () => {
    expect(await loadNarration(ROOT)).toEqual({ kind: 'absent' })
  })
})
