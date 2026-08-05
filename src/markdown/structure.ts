import { type BodyLine, visibleText } from '@/markdown/scan'

const HEADING = /^#{1,6}\s/
const LIST_ITEM = /^(\s*)([-*+]|\d+\.)\s+/
const TABLE_ROW = /^\s*\|/
const TABLE_SEPARATOR = /^\s*\|[\s:|-]+\|\s*$/
const BLOCKQUOTE = /^\s*>/

/**
 * A sentence ends on terminal punctuation followed by the start of another
 * sentence or by the end of the paragraph.
 *
 * Requiring an opening capital after the space is what keeps a version pin and
 * a decimal from each reading as two sentences, since neither is followed by
 * one. An abbreviation ahead of a capitalized word still counts, which
 * over-reports by one on the sentence that carries it and is why this measure
 * reports rather than gates.
 */
const SENTENCE_END = /[.!?]["'’”)\]]*(?=\s+["'“(\[]*[A-Z]|\s*$)/g

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
}

/**
 * Checkpoints as `standards/markdown.md` states them today.
 *
 * These are the fallback rather than the definition. Each is read out of the
 * standard per run, and this stands in for one the standard no longer states in
 * a shape the reader recognizes, so a rewording degrades a number rather than
 * the whole check. The report's legend names every checkpoint that fell back,
 * because a stale number quietly measuring the wrong thing is the failure mode
 * a silent default would ship.
 */
export const DEFAULT_CHECKPOINTS = {
  run: 40,
  peerBullet: 130,
  bullet: 400,
  paragraph: 400,
  sentences: 4,
  renderWidth: 80,
} as const

export type CheckpointName = keyof typeof DEFAULT_CHECKPOINTS

/**
 * Columns a source line wraps at when rendered.
 *
 * Nothing in this repository sets a line width and entries are authored one
 * line per bullet, so the rendered width is the viewer's rather than the file's.
 */
export const RENDER_WIDTH: number = DEFAULT_CHECKPOINTS.renderWidth

export interface Checkpoints {
  readonly run: number
  readonly peerBullet: number
  readonly bullet: number
  readonly paragraph: number
  readonly sentences: number
  readonly renderWidth: number
  /** Names that fell back, so the report can say which number is not the standard's. */
  readonly fellBack: readonly CheckpointName[]
}

export interface BulletFinding {
  readonly line: number
  /** Weight as folded, so a report says how far past the checkpoint it sits. */
  readonly characters: number
}

export interface ParagraphFinding {
  readonly line: number
  readonly sentences: number
  readonly characters: number
}

export interface StructureReport {
  readonly rel: string
  /** Rendered lines at the render width, not source lines. */
  readonly longestRun: number
  /** First line of the longest run, or 0 when the file has no run at all. */
  readonly longestRunLine: number
  readonly heavyBullets: readonly BulletFinding[]
  readonly heavyParagraphs: readonly ParagraphFinding[]
}

const PATTERNS: Record<CheckpointName, RegExp> = {
  run: /Past roughly (\d+) rendered lines/,
  peerBullet: /averaging under roughly (\d+) characters/,
  bullet: /Past roughly (\d+) characters in one top-level bullet/,
  paragraph: /Past roughly (\d+) characters in one paragraph/,
  sentences: /Keep paragraphs to ([a-z]+|\d+) sentences or fewer/,
  renderWidth: /wrapping each source line at (\d+) columns/,
}

/**
 * Reads each checkpoint out of the standard stating it.
 *
 * A number held in code is a second place the rule lives, and the two drift
 * silently because nothing compares them. What this buys is that raising a
 * checkpoint is an edit to the sentence a reader is pointed at, and what it
 * costs is a reader of prose, which is bounded by falling back per checkpoint
 * rather than per file.
 */
export function parseCheckpoints(markdown: string): Checkpoints {
  const fellBack: CheckpointName[] = []

  const read = (name: CheckpointName): number => {
    const match = markdown.match(PATTERNS[name])
    const raw = match?.[1]
    const value = raw ? (NUMBER_WORDS[raw] ?? Number(raw)) : Number.NaN

    if (!Number.isFinite(value) || value <= 0) {
      fellBack.push(name)
      return DEFAULT_CHECKPOINTS[name]
    }

    return value
  }

  return {
    run: read('run'),
    peerBullet: read('peerBullet'),
    bullet: read('bullet'),
    paragraph: read('paragraph'),
    sentences: read('sentences'),
    renderWidth: read('renderWidth'),
    fellBack,
  }
}

/**
 * Height a source line occupies once wrapped.
 *
 * A blank line renders as the gap it is rather than as nothing, which keeps it
 * the distance the source measure already counted it as.
 *
 * The width is measured against what renders, since a rendered line shows a
 * link's anchor text rather than its destination and a source measure
 * over-counts exactly where this rule cares how far a reader travels.
 */
export function renderedHeight(text: string, width = RENDER_WIDTH): number {
  return Math.max(1, Math.ceil(visibleText(text).length / width))
}

/**
 * Reports whether a run is the peer list the standard exempts.
 *
 * Every non-blank line has to be a list item at one indent. Prose mixed into
 * the run or a nested level inside it ends the exemption, because either one
 * means the block is no longer a flat set a reader can skim. Bullet count says
 * nothing on its own, since a catalog of one-liners and a wall of paragraphs
 * reach the same count and read nothing alike, so the average bullet decides.
 */
function isScannablePeerList(
  run: readonly BodyLine[],
  checkpoint: number,
): boolean {
  const indents = new Set<number>()
  let items = 0
  let characters = 0

  for (const line of run) {
    const text = line.text.trim()
    if (text === '') continue

    const match = line.text.match(LIST_ITEM)
    if (!match) return false
    indents.add(match[1].length)
    items++
    characters += visibleText(text).length
  }

  if (indents.size !== 1) return false

  return characters / items < checkpoint
}

/**
 * Reports whether a run is a table, the second shape the checkpoint cannot fix.
 *
 * The peer list above is exempt because it is already navigable. A table is
 * exempt for the other reason: the remedy does not exist. A heading dropped
 * inside one splits the table into two tables rather than breaking the run.
 *
 * Every non-blank line has to be a row, and a delimiter is required rather than
 * assumed. A run holding a table between paragraphs is genuinely mixed and a
 * heading breaks it at a seam either side, and a stack of lines opening with a
 * pipe and no delimiter renders as paragraph text.
 */
function isTableRun(run: readonly BodyLine[]): boolean {
  let separators = 0

  for (const line of run) {
    if (line.text.trim() === '') continue
    if (!TABLE_ROW.test(line.text)) return false
    if (TABLE_SEPARATOR.test(line.text)) separators++
  }

  return separators > 0
}

/**
 * Measures the longest run of lines no heading breaks, in rendered lines.
 *
 * Fenced lines are skipped rather than treated as breaks, per the standard:
 * they leave the count without ending the run, so prose either side of an
 * example still measures as the one stretch a reader scrolls through. Blank
 * lines do count, since the checkpoint is about how far a reader travels
 * between signposts and a blank line is distance like any other.
 *
 * Height is what a reader travels, and source lines only stand in for it while
 * lines stay short. A file authored one line per bullet puts a paragraph on
 * each, so a block of fifteen bullets measures as fifteen and renders past
 * sixty. Wrapping every line at a stated width is what closes that gap.
 */
export function longestRun(
  lines: readonly BodyLine[],
  checkpoints: Checkpoints,
): { length: number; line: number } {
  let longest = 0
  let longestLine = 0
  let run: BodyLine[] = []

  const close = (): void => {
    // The reported line is the run's first non-blank one, since that is what an
    // editor should open. A run of nothing but blank lines is the gap between
    // two headings rather than a stretch a reader travels, so it never counts.
    const first = run.find((line) => line.text.trim() !== '')

    if (
      first &&
      !isScannablePeerList(run, checkpoints.peerBullet) &&
      !isTableRun(run)
    ) {
      const height = run.reduce(
        (sum, line) => sum + renderedHeight(line.text, checkpoints.renderWidth),
        0,
      )

      if (height > longest) {
        longest = height
        longestLine = first.number
      }
    }
    run = []
  }

  for (const line of lines) {
    if (line.fenced) continue

    if (HEADING.test(line.text)) {
      close()
      continue
    }

    run.push(line)
  }

  close()

  return { length: longest, line: longestLine }
}

/**
 * Finds the top-level bullets carrying more than a decision.
 *
 * A nested item is left out rather than folded into its parent, since the
 * checkpoint asks what one bullet carries and a child carries its own. Lines
 * continuing a bullet do fold in, so a heavy bullet cannot fall under the
 * checkpoint by being wrapped across two source lines. A fenced line closes the
 * open bullet, which keeps a bullet from absorbing the example below it.
 */
export function heavyBullets(
  lines: readonly BodyLine[],
  checkpoints: Checkpoints,
): BulletFinding[] {
  const findings: BulletFinding[] = []
  let open: BulletFinding | null = null

  const close = (): void => {
    if (open && open.characters > checkpoints.bullet) findings.push(open)
    open = null
  }

  for (const line of lines) {
    if (line.fenced) {
      close()
      continue
    }

    const item = line.text.match(LIST_ITEM)
    const text = line.text.trim()

    // Structure is read off the raw line and only the weight is masked. A line
    // carrying nothing but an autolink has no visible text at all, and reading
    // its masked form as blank would close the bullet it continues.
    if (item) {
      close()
      if (item[1].length === 0) {
        open = { line: line.number, characters: visibleText(text).length }
      }
      continue
    }

    if (text === '' || HEADING.test(line.text) || TABLE_ROW.test(line.text)) {
      close()
      continue
    }

    // The joining space a wrapped line would have carried, so folding two
    // source lines measures what one unwrapped line would have.
    if (open)
      open = {
        ...open,
        characters: open.characters + visibleText(text).length + 1,
      }
  }

  close()

  return findings
}

function countSentences(text: string): number {
  return [...text.matchAll(SENTENCE_END)].length
}

/**
 * Finds the prose paragraphs past either half of the standard's checkpoint.
 *
 * Both halves are stated in the standard and both are read from it. The weight
 * half was added there rather than borrowed from the bullet checkpoint, which
 * governs a different construct: one number feeding both would move the
 * paragraph rule whenever the bullet rule was changed, and an author reading
 * the sentence cap would find no weight rule to read at all.
 *
 * The two numbers coincide today because paragraph and bullet weight measure
 * one population, sharing a median near 170 characters with no gap behind
 * either candidate. They are separate checkpoints regardless, so either moves
 * without dragging the other.
 *
 * A paragraph is a run of consecutive prose lines. A heading, a list item, a
 * table row, a blockquote, a blank line, and a fence each end one, so a bullet
 * is measured by `heavyBullets` alone and never twice.
 */
export function heavyParagraphs(
  lines: readonly BodyLine[],
  checkpoints: Checkpoints,
): ParagraphFinding[] {
  const findings: ParagraphFinding[] = []
  let block: BodyLine[] = []

  const close = (): void => {
    if (block.length > 0) {
      const text = block.map((line) => line.text.trim()).join(' ')
      const sentences = countSentences(text)
      const characters = visibleText(text).length

      if (
        sentences > checkpoints.sentences ||
        characters > checkpoints.paragraph
      ) {
        findings.push({ line: block[0].number, sentences, characters })
      }
    }
    block = []
  }

  for (const line of lines) {
    const text = line.text.trim()
    const breaks =
      line.fenced ||
      text === '' ||
      HEADING.test(line.text) ||
      LIST_ITEM.test(line.text) ||
      TABLE_ROW.test(line.text) ||
      BLOCKQUOTE.test(line.text)

    if (breaks) {
      close()
      continue
    }

    block.push(line)
  }

  close()

  return findings
}

export function measureStructure(
  rel: string,
  lines: readonly BodyLine[],
  checkpoints: Checkpoints,
): StructureReport {
  const run = longestRun(lines, checkpoints)

  return {
    rel,
    longestRun: run.length,
    longestRunLine: run.line,
    heavyBullets: heavyBullets(lines, checkpoints),
    heavyParagraphs: heavyParagraphs(lines, checkpoints),
  }
}
