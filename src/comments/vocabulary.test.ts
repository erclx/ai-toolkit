import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  loadVocabulary,
  parseVocabulary,
  VOCABULARY_HEADING,
} from '@/comments/vocabulary'

let ROOT: string

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'canon-vocabulary-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

const RULE = `# Code comment standards

## Comments

- Comment what the code cannot say.

${VOCABULARY_HEADING}

- Markers: \`FIXED\`, \`HACK\`, \`TODO\`
- Prose: \`used to\`, \`previously\`

## Density

- Report density, do not grade it. Ignore \`this\` backtick.
`

function seedRule(relativePath: string, text: string): void {
  const path = join(ROOT, relativePath)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, text)
}

describe('parseVocabulary', () => {
  it('should collect the backticked terms under the heading', () => {
    expect(parseVocabulary(RULE)).toEqual([
      'FIXED',
      'HACK',
      'TODO',
      'used to',
      'previously',
    ])
  })

  it('should stop at the next heading so unrelated terms are excluded', () => {
    expect(parseVocabulary(RULE)).not.toContain('this')
  })

  it('should return undefined when no heading publishes a vocabulary', () => {
    expect(parseVocabulary('# A rule\n\n- Do something.\n')).toBeUndefined()
  })
})

describe('loadVocabulary', () => {
  it('should report absent when no rule publishes a vocabulary', async () => {
    seedRule(
      '.claude/rules/core/000-constitution.md',
      '# Role\n\n- Be terse.\n',
    )

    expect(await loadVocabulary(ROOT)).toEqual({ kind: 'absent' })
  })

  it('should report absent when there is no rules directory at all', async () => {
    expect(await loadVocabulary(ROOT)).toEqual({ kind: 'absent' })
  })

  it('should load the terms and name the rule they came from', async () => {
    seedRule('.claude/rules/core/090-comments.md', RULE)

    const vocabulary = await loadVocabulary(ROOT)

    expect(vocabulary).toMatchObject({
      kind: 'loaded',
      source: '.claude/rules/core/090-comments.md',
    })
  })

  it('should prefer the installed rule over the toolkit source', async () => {
    seedRule('governance/rules/core/090-comments.md', RULE)
    seedRule('.claude/rules/core/090-comments.md', RULE)

    const vocabulary = await loadVocabulary(ROOT)

    expect(vocabulary).toMatchObject({
      source: '.claude/rules/core/090-comments.md',
    })
  })

  it('should fall back to the toolkit source when nothing is installed', async () => {
    seedRule('governance/rules/core/090-comments.md', RULE)

    const vocabulary = await loadVocabulary(ROOT)

    expect(vocabulary).toMatchObject({
      source: 'governance/rules/core/090-comments.md',
    })
  })
})
