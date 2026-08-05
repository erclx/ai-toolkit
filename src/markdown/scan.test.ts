import { describe, expect, it } from 'vitest'
import {
  type BanSets,
  bodyLines,
  linesOutsideFences,
  maskDisplayed,
  scanBans,
} from '@/markdown/scan'

const BANS: BanSets = {
  characters: ['—', ';'],
  words: ['simply', 'leverage', 'just'],
  spellings: ['organise', 'colour'],
}

function scan(source: string) {
  return scanBans(bodyLines(source), BANS)
}

function terms(source: string): string[] {
  return scan(source).map((found) => found.term)
}

describe('bodyLines', () => {
  it('should keep the original line number after dropping frontmatter', () => {
    const [line] = bodyLines('---\ntitle: X\n---\n\n# Heading\n').filter(
      (each) => each.text !== '',
    )

    expect(line.number).toBe(5)
  })

  it('should read a frontmatter block inside a fenced template as body', () => {
    const source = '# Heading\n\n```markdown\n---\ntitle: X\n---\n```\n'

    const lines = bodyLines(source)

    expect(lines[0].text).toBe('# Heading')
    expect(lines.filter((line) => line.fenced)).toHaveLength(5)
  })

  it('should close a four-backtick block only on a run of its own length', () => {
    const source = '````markdown\n```\ninner\n```\n````\n\nOutside.\n'

    const lines = bodyLines(source)

    expect(lines.filter((line) => line.fenced)).toHaveLength(5)
    expect(lines.at(-1)?.fenced).toBe(false)
  })

  it('should leave an unterminated fence swallowing the rest of the file', () => {
    const source = '# Heading\n\n```ts\nconst x = 1\n\nMore prose.\n'

    // Under-reporting a malformed file beats reporting its remainder as
    // content, since the remainder is whatever the unclosed block holds.
    expect(bodyLines(source).filter((line) => line.fenced)).toHaveLength(4)
  })
})

describe('linesOutsideFences', () => {
  it('should keep frontmatter, which is content to a record validator', () => {
    const kept = linesOutsideFences('---\ntitle: X\n---\n\nBody.\n')

    expect(kept).toContain('title: X')
  })

  it('should drop a fenced block and both of its delimiters', () => {
    const kept = linesOutsideFences(
      'Before.\n```ts\nconst x = 1\n```\nAfter.\n',
    )

    expect(kept.filter((line) => line !== '')).toEqual(['Before.', 'After.'])
  })
})

describe('maskDisplayed', () => {
  it('should blank an inline code span while holding its width', () => {
    const masked = maskDisplayed('Use `a; b` here.')

    expect(masked).toHaveLength('Use `a; b` here.'.length)
    expect(masked).not.toContain(';')
  })

  it('should blank a double-backtick span holding a single backtick', () => {
    expect(maskDisplayed('Write ``a`b;`` now.')).not.toContain(';')
  })

  it('should blank a link destination and leave its anchor text', () => {
    const masked = maskDisplayed('See [the docs](https://x.test/a;b=1) now.')

    expect(masked).toContain('the docs')
    expect(masked).not.toContain(';')
  })
})

describe('scanBans', () => {
  it('should report a banned character', () => {
    expect(terms('A clause; another.\n')).toEqual([';'])
  })

  it('should report a banned word in either casing', () => {
    expect(terms('Simply run it.\n')).toEqual(['simply'])
  })

  it('should report a banned spelling', () => {
    expect(terms('We organise the files.\n')).toEqual(['organise'])
  })

  it('should not report a word that merely ends in the banned suffix', () => {
    // The intake scanner matched `-ise` as a pattern and produced 46 bad hits
    // from words like these, which a closed set of whole words never reaches.
    expect(terms('The exercises and promises were revised.\n')).toEqual([])
  })

  it('should not report a banned word inside a longer one', () => {
    // `just` sits inside `adjustment`, which a substring match would report.
    expect(terms('The adjustment held.\n')).toEqual([])
  })

  it('should report nothing inside frontmatter', () => {
    expect(terms('---\ntitle: Simply; a title\n---\n\nBody.\n')).toEqual([])
  })

  it('should report nothing inside a fenced block', () => {
    expect(terms('# H\n\n```ts\nconst a = 1; // simply\n```\n')).toEqual([])
  })

  it('should report nothing inside an inline code span', () => {
    expect(terms('The `a; b` operator and `simply` flag.\n')).toEqual([])
  })

  it('should point at the column the term sits in', () => {
    const [found] = scan('Ab; cd.\n')

    expect(found).toMatchObject({ line: 1, column: 2, kind: 'character' })
  })

  it('should sort findings by line then column', () => {
    const found = scan('Simply; go.\n\nWe organise it.\n')

    expect(found.map((each) => [each.line, each.term])).toEqual([
      [1, 'simply'],
      [1, ';'],
      [3, 'organise'],
    ])
  })
})
