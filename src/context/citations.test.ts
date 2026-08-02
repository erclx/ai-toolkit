import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  auditCitations,
  citationPattern,
  collectCitations,
  IGNORE_MARKER,
  isFixture,
} from '@/context/citations'

const PATTERN = citationPattern(['context', 'diagrams'])

function paths(text: string, rel = 'docs/agents.md'): string[] {
  return collectCitations(rel, text, PATTERN).map((citation) => citation.path)
}

describe('citationPattern', () => {
  it('should match a path in an audited folder', () => {
    expect(paths('See `.claude/context/cli.md` for the layout.')).toEqual([
      '.claude/context/cli.md',
    ])
  })

  it('should match a path nested under a split domain', () => {
    expect(paths('Read `.claude/context/claude-plugin/skills.md`.')).toEqual([
      '.claude/context/claude-plugin/skills.md',
    ])
  })

  it('should not match a folder outside the audited set', () => {
    expect(paths('Read `.claude/standards/prose.md` first.')).toEqual([])
  })
})

describe('collectCitations', () => {
  it('should report the line the citation sits on', () => {
    const found = collectCitations(
      'docs/agents.md',
      'First.\nSecond.\nSee `.claude/context/cli.md`.\n',
      PATTERN,
    )

    expect(found).toEqual([
      { file: 'docs/agents.md', line: 3, path: '.claude/context/cli.md' },
    ])
  })

  it('should collect every citation on one line', () => {
    expect(
      paths('Both `.claude/context/cli.md` and `.claude/diagrams/index.md`.'),
    ).toEqual(['.claude/context/cli.md', '.claude/diagrams/index.md'])
  })

  it('should skip a fenced block in markdown', () => {
    const text = [
      'Good: See `.claude/context/cli.md`.',
      '',
      '```markdown',
      'Bad: See `.claude/context/retrieval.md` for the flow.',
      '```',
      '',
      'Also `.claude/diagrams/index.md`.',
    ].join('\n')

    expect(paths(text)).toEqual([
      '.claude/context/cli.md',
      '.claude/diagrams/index.md',
    ])
  })

  it('should keep scanning a shell file whose text contains a fence', () => {
    const text = ['echo "```"', 'echo "see .claude/context/cli.md"'].join('\n')

    expect(paths(text, 'scripts/core/thing.sh')).toEqual([
      '.claude/context/cli.md',
    ])
  })

  it('should skip a line carrying the ignore marker', () => {
    const text = `One \`.claude/context/web.md\` per domain. <!-- ${IGNORE_MARKER} -->`

    expect(paths(text)).toEqual([])
  })
})

describe('auditCitations', () => {
  it('should report unavailable rather than clean outside a git repository', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aitk-citations-'))

    try {
      expect(await auditCitations(root, ['context'])).toEqual({
        kind: 'unavailable',
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('isFixture', () => {
  it.each([
    'scripts/sandbox/claude/docs.sh',
    'scripts/eval/result-context.md',
    'src/docs/read.test.ts',
    'src/gov/fixtures/rule.md',
    'src/gov/__fixtures__/rule.md',
  ])('should treat %s as a fixture', (rel) => {
    expect(isFixture(rel)).toBe(true)
  })

  it.each(['docs/agents.md', '.claude/context/cli.md', 'src/context/audit.ts'])(
    'should treat %s as a real reference',
    (rel) => {
      expect(isFixture(rel)).toBe(false)
    },
  )
})
