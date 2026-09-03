import { describe, expect, it } from 'vitest'
import {
  isShippedCorpus,
  REFERENCE_MARKER,
  referencesIn,
  SHIPPED_CORPORA,
} from '@/shipped/references'

describe('referencesIn', () => {
  it('should report a bare pull request number', () => {
    expect(
      referencesIn(
        'claude/skills/alpha/SKILL.md',
        'The poll told an operator the opposite of what the worker said in #1307.',
      ),
    ).toEqual([
      {
        file: 'claude/skills/alpha/SKILL.md',
        line: 1,
        kind: 'pull-request',
        text: '#1307',
      },
    ])
  })

  it('should report a bare commit sha', () => {
    expect(
      referencesIn('docs/agents/alpha.md', 'Measured at `6c273324`.'),
    ).toEqual([
      {
        file: 'docs/agents/alpha.md',
        line: 1,
        kind: 'commit',
        text: '6c273324',
      },
    ])
  })

  it('should report an all-digit sha, which requiring a letter would drop', () => {
    const found = referencesIn(
      'claude/skills/alpha/SKILL.md',
      'against `5653721`',
    )

    expect(found).toHaveLength(1)
    expect(found[0]?.kind).toBe('commit')
    expect(found[0]?.text).toBe('5653721')
  })

  it('should report a seven-digit measurement, which admitting an all-digit sha admits with it', () => {
    const found = referencesIn(
      'docs/agents/alpha.md',
      'The sweep read 2119000 paragraphs.',
    )

    expect(found).toHaveLength(1)
    expect(found[0]?.kind).toBe('commit')
  })

  it('should let the marker answer a seven-digit measurement, since no narrowing can', () => {
    expect(
      referencesIn(
        'docs/agents/alpha.md',
        `The sweep read 2119000 paragraphs. <!-- ${REFERENCE_MARKER}: a count, not a commit -->`,
      ),
    ).toEqual([])
  })

  it('should report a pull request number qualified with its own repository', () => {
    expect(
      referencesIn(
        'claude/skills/alpha/SKILL.md',
        'Measured on `erclx/canon#1299`.',
      ),
    ).toEqual([
      {
        file: 'claude/skills/alpha/SKILL.md',
        line: 1,
        kind: 'pull-request',
        text: 'erclx/canon#1299',
        selfCitation: true,
      },
    ])
  })

  it('should pass the qualified form a shipped body already carries', () => {
    expect(
      referencesIn(
        'claude/skills/claude-worktree/SKILL.md',
        'Tracked upstream as `anthropics/claude-code#58345`, closed as not planned.',
      ),
    ).toEqual([])
  })

  it('should report a sha qualified with its own repository', () => {
    expect(
      referencesIn(
        'docs/agents/alpha.md',
        'A pass written against `erclx/canon@5653721`.',
      ),
    ).toEqual([
      {
        file: 'docs/agents/alpha.md',
        line: 1,
        kind: 'commit',
        text: 'erclx/canon@5653721',
        selfCitation: true,
      },
    ])
  })

  it('should pass a Tailwind arbitrary hex color, which an unbounded pattern reads as #316', () => {
    expect(
      referencesIn(
        'governance/rules/framework/250-tailwind.md',
        '- Use arbitrary values (`bg-[#316ff6]`) instead.',
      ),
    ).toEqual([])
  })

  it('should pass a hex color long enough to reach the sha floor', () => {
    expect(
      referencesIn('standards/design.md', 'as in `` `#ffffff ? verify` ``'),
    ).toEqual([])
  })

  it('should pass a sha embedded in a path segment', () => {
    expect(
      referencesIn(
        'docs/agents/alpha.md',
        'Written to `.canon/review/6c273324/report.md`.',
      ),
    ).toEqual([])
  })

  it('should report every token on a line rather than the line once', () => {
    const found = referencesIn(
      'claude/skills/claude-orchestrate/references/orchestrator-poll.md',
      'Measured on `#1299`, where a pass written against `5653721` landed stamped `a5ceb40`.',
    )

    expect(found.map((reference) => reference.text)).toEqual([
      '#1299',
      '5653721',
      'a5ceb40',
    ])
  })

  it('should mute a reference marked on its own line', () => {
    expect(
      referencesIn(
        'standards/publish.md',
        `Write \`#123\` there. <!-- ${REFERENCE_MARKER}: illustrates the form this section defines -->`,
      ),
    ).toEqual([])
  })

  it('should mute a reference marked on the line above', () => {
    expect(
      referencesIn(
        'standards/diagrams.md',
        `<!-- ${REFERENCE_MARKER}: illustrates the verified field's format -->\nas in \`73e9a3f8 2026-08-02\`.`,
      ),
    ).toEqual([])
  })

  it('should mute a same-repository illustration of a date-exclusion clause', () => {
    expect(
      referencesIn(
        'docs/agents/alpha.md',
        `Runs on \`erclx/canon#632\` and \`erclx/canon#634\` landed 2026-08-02. <!-- ${REFERENCE_MARKER}: illustrates the input shape the rule reads -->`,
      ),
    ).toEqual([])
  })

  it('should mute a same-repository illustration of a definition-versus-edit-target bullet', () => {
    expect(
      referencesIn(
        'docs/agents/alpha.md',
        `A bullet can cite where something is defined while claiming an edit somewhere else, as \`erclx/canon#1274\` does. <!-- ${REFERENCE_MARKER}: illustrates the input shape the rule reads -->`,
      ),
    ).toEqual([])
  })

  it('should ignore a bare marker token carrying no reason', () => {
    expect(
      referencesIn(
        'standards/publish.md',
        `Write \`#123\` there. <!-- ${REFERENCE_MARKER} -->`,
      ),
    ).toHaveLength(1)
  })

  it('should report nothing in prose carrying no reference', () => {
    expect(
      referencesIn('docs/agents/alpha.md', 'The count reads low, and it errs.'),
    ).toEqual([])
  })

  it('should carry the one-based line a reader clicks', () => {
    const found = referencesIn(
      'docs/agents/alpha.md',
      'first\nsecond\nsee `#516`',
    )

    expect(found[0]?.line).toBe(3)
  })
})

describe('isShippedCorpus', () => {
  it.each(SHIPPED_CORPORA)('should include %s', (corpus) => {
    expect(isShippedCorpus(`${corpus}/alpha.md`)).toBe(true)
  })

  it('should exclude a tree the files field negates', () => {
    expect(isShippedCorpus('scripts/sandbox/claude/review.sh')).toBe(false)
    expect(isShippedCorpus('scripts/eval/run.sh')).toBe(false)
  })

  it('should exclude a test file, which no tarball carries', () => {
    expect(isShippedCorpus('scripts/lib/worktree.test.ts')).toBe(false)
  })

  it('should exclude a corpus whose reader already holds this repository', () => {
    expect(isShippedCorpus('.claude/context/development/gates.md')).toBe(false)
    expect(
      isShippedCorpus('internal/rules/claude/598-authoring-layout.md'),
    ).toBe(false)
    expect(isShippedCorpus('wiki/claude/claude-worktrees.md')).toBe(false)
    expect(isShippedCorpus('src/design/base.css')).toBe(false)
  })

  it('should not match a corpus name as a bare prefix of another path', () => {
    expect(isShippedCorpus('docs-site/alpha.md')).toBe(false)
    expect(isShippedCorpus('standards-archive/alpha.md')).toBe(false)
  })
})
