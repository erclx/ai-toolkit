import { describe, expect, it } from 'vitest'
import {
  README_PARAPHRASE_MARKER,
  readmeCitationsIn,
} from '@/web/readme-citations'

describe('readmeCitationsIn', () => {
  it('should parse a single quoted phrase', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      '// README.md: "keeps one authoritative copy"\n',
    )

    expect(citations).toEqual([
      {
        file: 'web/src/content/copy.ts',
        line: 1,
        kind: 'quoted',
        text: '// README.md: "keeps one authoritative copy"',
        phrases: ['keeps one authoritative copy'],
      },
    ])
  })

  it('should parse two space-separated phrases off one anchor', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      '// README.md: "first phrase" "second phrase"\n',
    )

    expect(citations).toHaveLength(1)
    expect(citations[0]?.phrases).toEqual(['first phrase', 'second phrase'])
  })

  it('should flag a bare line-number citation', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      "// README.md:23, the reader's problem\n",
    )

    expect(citations).toEqual([
      {
        file: 'web/src/content/copy.ts',
        line: 1,
        kind: 'bare',
        text: "// README.md:23, the reader's problem",
        phrases: [],
      },
    ])
  })

  it('should flag a bare two-number citation', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      '// README.md:46, 49\n',
    )

    expect(citations).toHaveLength(1)
    expect(citations[0]?.kind).toBe('bare')
  })

  it('should flag a bare range citation', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      '// README.md:58-66, condensed\n',
    )

    expect(citations).toHaveLength(1)
    expect(citations[0]?.kind).toBe('bare')
  })

  it('should mute a citation carrying the paraphrase marker on its own line', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      `// README.md: ${README_PARAPHRASE_MARKER}: condensed from a bullet list\n`,
    )

    expect(citations).toEqual([
      {
        file: 'web/src/content/copy.ts',
        line: 1,
        kind: 'paraphrase',
        text: `// README.md: ${README_PARAPHRASE_MARKER}: condensed from a bullet list`,
        phrases: [],
      },
    ])
  })

  it('should mute a citation when the marker sits on the line above', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      `// ${README_PARAPHRASE_MARKER}: condensed from a bullet list\n// README.md: "some phrase"\n`,
    )

    expect(citations).toHaveLength(1)
    expect(citations[0]?.kind).toBe('paraphrase')
  })

  it('should read nothing from a line mentioning README.md with no colon', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      'carrying the `README.md` line it derives from\n',
    )

    expect(citations).toEqual([])
  })

  it('should read nothing from a file carrying no anchor at all', () => {
    const citations = readmeCitationsIn(
      'web/src/content/copy.ts',
      'export const hero = {}\n',
    )

    expect(citations).toEqual([])
  })
})
