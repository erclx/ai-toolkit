import { describe, expect, it } from 'vitest'
import { bodyLines } from '@/markdown/scan'
import {
  type Checkpoints,
  DEFAULT_CHECKPOINTS,
  measureStructure,
  parseCheckpoints,
  RENDER_WIDTH,
} from '@/markdown/structure'

const FRONTMATTER = '---\ntitle: CI\ndescription: A domain\n---\n\n'

/** Bullet counts the exempt catalog and the reported wall both hit. */
const PEER_COUNT = 55

/** Characters a bullet averages in each of the two shapes the corpus holds. */
const CATALOG_BULLET = 94
const PARAGRAPH_BULLET = 394

const CHECKPOINTS: Checkpoints = { ...DEFAULT_CHECKPOINTS, fellBack: [] }
const RUN_CHECKPOINT = CHECKPOINTS.run
const BULLET_CHECKPOINT = CHECKPOINTS.bullet
const PARAGRAPH_CHECKPOINT = CHECKPOINTS.paragraph

function measure(source: string) {
  return measureStructure('ci.md', bodyLines(source), CHECKPOINTS)
}

function prose(count: number): string {
  return Array.from({ length: count }, (_, index) => `Line ${index + 1}.`).join(
    '\n',
  )
}

function bullets(count: number, indent = ''): string {
  return Array.from(
    { length: count },
    (_, index) => `${indent}- Item ${index + 1}`,
  ).join('\n')
}

function weightedBullets(count: number, width: number): string {
  return Array.from({ length: count }, (_, index) =>
    `- Item ${index + 1} `.padEnd(width, 'weight '),
  ).join('\n')
}

function table(rows: string[]): string {
  return ['| Name | Purpose |', '| --- | --- |', ...rows].join('\n')
}

function catalogRows(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
  )
}

/** A bullet of an exact character count, so a boundary case lands on it. */
function bullet(characters: number): string {
  return `- ${'w'.repeat(characters - 2)}`
}

/** Links whose destinations outweigh the anchor text a reader is shown. */
function links(count: number): string {
  return Array.from(
    { length: count },
    (_, index) =>
      `[text ${index}](https://x.test/a/very/long/destination/${index})`,
  ).join(' ')
}

/** Sentences of a stated length, so weight and count vary independently. */
function sentences(count: number, width = 20): string {
  return Array.from(
    { length: count },
    (_, index) => `S${index + 1} ${'w'.repeat(width)}.`,
  ).join(' ')
}

describe('parseCheckpoints', () => {
  it('should read every checkpoint out of the shipped standard', async () => {
    const standard = await Bun.file('standards/markdown.md').text()

    const checkpoints = parseCheckpoints(standard)

    expect(checkpoints.fellBack).toEqual([])
    expect(checkpoints).toMatchObject(DEFAULT_CHECKPOINTS)
  })

  it('should read a sentence count the standard spells as a word', () => {
    const standard = 'Keep paragraphs to six sentences or fewer.'

    expect(parseCheckpoints(standard).sentences).toBe(6)
  })

  it('should name each checkpoint it could not read rather than failing quietly', () => {
    const checkpoints = parseCheckpoints('# Nothing stated here\n')

    expect(checkpoints.fellBack).toEqual([
      'run',
      'peerBullet',
      'bullet',
      'paragraph',
      'sentences',
      'renderWidth',
    ])
    expect(checkpoints.bullet).toBe(DEFAULT_CHECKPOINTS.bullet)
  })
})

describe('longestRun', () => {
  it('should report the longest run of lines no heading breaks', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(60)}\n\n## Layout\n\n${prose(5)}\n`

    expect(measure(source).longestRun).toBeGreaterThan(RUN_CHECKPOINT)
  })

  it('should point at the first non-blank line of the longest run', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(60)}\n`

    expect(measure(source).longestRunLine).toBe(8)
  })

  it('should let a heading of any level break a run', () => {
    const half = prose(30)
    const source = `${FRONTMATTER}# CI\n\n${half}\n\n#### Seam\n\n${half}\n`

    expect(measure(source).longestRun).toBeLessThan(RUN_CHECKPOINT)
  })

  it('should not count a heading that is markdown inside a fenced block', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(20)}\n\n\`\`\`markdown\n## Not a real heading\n\n### Nor this\n\`\`\`\n\n${prose(20)}\n`

    // The fence neither breaks the run nor adds to it, so the two prose
    // stretches measure as the single run a reader scrolls through.
    expect(measure(source).longestRun).toBe(43)
  })

  it('should keep a four-backtick block closed against the three inside it', () => {
    const inner = `\`\`\`markdown\n## Not a real heading\n\`\`\``
    const source = `${FRONTMATTER}# CI\n\n${prose(20)}\n\n\`\`\`\`markdown\n${inner}\n\`\`\`\`\n\n${prose(20)}\n`

    // A walker toggling on any backtick run reads the inner closing fence as an
    // opening and inverts the rest of the file, which is what reported ten
    // closing fences as bare during intake.
    expect(measure(source).longestRun).toBe(43)
  })

  it('should exempt a run whose lines are all list items at one level', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(60)}\n`

    expect(measure(source).longestRun).toBe(0)
  })

  it('should count a wrapped line as the rows it renders', () => {
    const source = `${FRONTMATTER}# CI\n\n${'x'.repeat(RENDER_WIDTH * 3)}\n`

    // The blank line after the heading is one row and the long line is three.
    expect(measure(source).longestRun).toBe(4)
  })

  it('should wrap a link-heavy line at the width its anchor text renders', () => {
    const source = `${FRONTMATTER}# CI\n\n${links(10)}\n`

    // Raw the line wraps seven times. A rendered line shows anchor text rather
    // than destinations, so the run is the blank line plus the one row it fills.
    expect(links(10).length).toBeGreaterThan(RENDER_WIDTH * 6)
    expect(measure(source).longestRun).toBe(2)
  })

  it('should exempt a flat catalog of short peers', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(PEER_COUNT, CATALOG_BULLET)}\n`

    expect(measure(source).longestRun).toBe(0)
  })

  it('should report paragraph bullets at the count the catalog is exempt at', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(PEER_COUNT, PARAGRAPH_BULLET)}\n`

    expect(measure(source).longestRun).toBeGreaterThan(RUN_CHECKPOINT)
  })

  it('should report a bullet block whose source lines stay under the checkpoint', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(15, PARAGRAPH_BULLET)}\n`

    // Fifteen bullets and a blank line are sixteen source lines, so only the
    // rendered measure reaches the checkpoint.
    expect(measure(source).longestRun).toBeGreaterThan(RUN_CHECKPOINT)
  })

  it('should end the exemption when the list nests a second level', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(30)}\n${bullets(30, '  ')}\n`

    expect(measure(source).longestRun).toBeGreaterThan(RUN_CHECKPOINT)
  })

  it('should end the exemption when prose is mixed into the list', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(30)}\nA sentence between them.\n${bullets(30)}\n`

    expect(measure(source).longestRun).toBeGreaterThan(RUN_CHECKPOINT)
  })

  it('should exempt a run whose lines are all table rows', () => {
    const source = `${FRONTMATTER}# CI\n\n${table(catalogRows(45))}\n`

    expect(measure(source).longestRun).toBe(0)
  })

  it('should end the table exemption when prose sits either side of it', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(2)}\n\n${table(catalogRows(45))}\n\n${prose(2)}\n`

    expect(measure(source).longestRun).toBeGreaterThan(RUN_CHECKPOINT)
  })

  it('should refuse the table exemption to piped lines carrying no delimiter', () => {
    const source = `${FRONTMATTER}# CI\n\n${catalogRows(45).join('\n')}\n`

    expect(measure(source).longestRun).toBeGreaterThan(RUN_CHECKPOINT)
  })
})

describe('heavyBullets', () => {
  it('should report a top-level bullet past the character checkpoint', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullet(BULLET_CHECKPOINT + 1)}\n`

    expect(measure(source).heavyBullets).toEqual([
      { line: 8, characters: BULLET_CHECKPOINT + 1 },
    ])
  })

  it('should leave a bullet at the checkpoint unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullet(BULLET_CHECKPOINT)}\n`

    expect(measure(source).heavyBullets).toEqual([])
  })

  it('should leave a nested bullet unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n- Parent\n  ${bullet(BULLET_CHECKPOINT + 1)}\n`

    expect(measure(source).heavyBullets).toEqual([])
  })

  it('should ignore a bullet that is an example inside a fenced block', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n${bullet(BULLET_CHECKPOINT + 1)}\n\`\`\`\n`

    expect(measure(source).heavyBullets).toEqual([])
  })

  it('should measure a link-heavy bullet against the text a reader sees', () => {
    const item = `- ${links(10)}`
    const source = `${FRONTMATTER}# CI\n\n${item}\n`

    expect(item.length).toBeGreaterThan(BULLET_CHECKPOINT)
    expect(measure(source).heavyBullets).toEqual([])
  })

  it('should fold a continuation line into the bullet it belongs to', () => {
    const half = Math.ceil((BULLET_CHECKPOINT + 1) / 2)
    const source = `${FRONTMATTER}# CI\n\n${bullet(half)}\n${'w'.repeat(half)}\n`

    // Neither source line reaches the checkpoint on its own, so a wrapped
    // bullet only reports once the two are measured as the one bullet they are.
    expect(measure(source).heavyBullets).toEqual([
      { line: 8, characters: half * 2 + 1 },
    ])
  })
})

describe('heavyParagraphs', () => {
  it('should report a paragraph past the sentence checkpoint', () => {
    const source = `${FRONTMATTER}# CI\n\n${sentences(CHECKPOINTS.sentences + 1)}\n`

    const [found] = measure(source).heavyParagraphs
    expect(found.line).toBe(8)
    expect(found.sentences).toBe(CHECKPOINTS.sentences + 1)
  })

  it('should leave a paragraph at the sentence checkpoint unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n${sentences(CHECKPOINTS.sentences)}\n`

    expect(measure(source).heavyParagraphs).toEqual([])
  })

  it('should report a short-sentence-count paragraph past the weight checkpoint', () => {
    const source = `${FRONTMATTER}# CI\n\n${sentences(2, PARAGRAPH_CHECKPOINT)}\n`

    // A sentence cap alone is satisfied by writing fewer and longer ones. The
    // heaviest paragraph measured across the corpus ran 1159 characters in two
    // sentences and passed every sentence count.
    const [found] = measure(source).heavyParagraphs
    expect(found.sentences).toBe(2)
    expect(found.characters).toBeGreaterThan(PARAGRAPH_CHECKPOINT)
  })

  it('should measure weight against its own checkpoint rather than the bullet one', () => {
    const lowered: Checkpoints = { ...CHECKPOINTS, paragraph: 120 }
    const source = `${FRONTMATTER}# CI\n\n${sentences(2, 80)}\n`

    // Lowering the paragraph number well under the bullet one is what shows
    // which of the two the paragraph measure reads, whatever the standard says.
    expect(measure(source).heavyParagraphs).toEqual([])
    expect(
      measureStructure('ci.md', bodyLines(source), lowered).heavyParagraphs,
    ).toHaveLength(1)
  })

  it('should measure a link-heavy paragraph against the text a reader sees', () => {
    // Sized from the checkpoint rather than fixed, since a raw length that has
    // to sit past it tests nothing on the run that moves the number.
    const paragraph = links(Math.ceil(PARAGRAPH_CHECKPOINT / 40))
    const source = `${FRONTMATTER}# CI\n\n${paragraph}\n`

    // Measured across the corpus this is the single largest correction: the
    // heaviest paragraph ran 1159 raw characters against 319 a reader is shown.
    expect(paragraph.length).toBeGreaterThan(PARAGRAPH_CHECKPOINT)
    expect(measure(source).heavyParagraphs).toEqual([])
  })

  it('should report the visible weight rather than the raw one', () => {
    const paragraph = `${links(10)} ${'w'.repeat(PARAGRAPH_CHECKPOINT)}`
    const source = `${FRONTMATTER}# CI\n\n${paragraph}\n`

    const [found] = measure(source).heavyParagraphs
    expect(found.characters).toBeGreaterThan(PARAGRAPH_CHECKPOINT)
    expect(found.characters).toBeLessThan(paragraph.length)
  })

  it('should fold the lines of a wrapped paragraph into one measure', () => {
    const half = 'w'.repeat(Math.ceil(PARAGRAPH_CHECKPOINT / 2))
    const source = `${FRONTMATTER}# CI\n\n${half}\n${half}\n`

    expect(measure(source).heavyParagraphs).toHaveLength(1)
  })

  it('should end a paragraph at a blank line', () => {
    const half = sentences(CHECKPOINTS.sentences - 1)
    const source = `${FRONTMATTER}# CI\n\n${half}\n\n${half}\n`

    expect(measure(source).heavyParagraphs).toEqual([])
  })

  it('should leave a heavy bullet to the bullet measure rather than counting it twice', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullet(BULLET_CHECKPOINT + 1)}\n`

    expect(measure(source).heavyParagraphs).toEqual([])
    expect(measure(source).heavyBullets).toHaveLength(1)
  })

  it('should ignore a paragraph that is an example inside a fenced block', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n${sentences(CHECKPOINTS.sentences + 3)}\n\`\`\`\n`

    expect(measure(source).heavyParagraphs).toEqual([])
  })

  it('should not read a version pin as the end of a sentence', () => {
    const source = `${FRONTMATTER}# CI\n\nThe pin is 0.63.1 and the cap is 4.5 for now.\n`

    expect(measure(source).heavyParagraphs).toEqual([])
  })
})
