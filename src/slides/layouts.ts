import type PptxGenJS from 'pptxgenjs'
import type { Slide } from '@/slides/parse'
import { FONTS, type Theme, TYPE } from '@/slides/styles'

type Deck = InstanceType<typeof PptxGenJS>
type PptxSlide = ReturnType<Deck['addSlide']>

export interface LayoutInfo {
  name: string
  description: string
}

export interface NavEntry {
  title: string
  slideNumber: number
}

export interface DeckNav {
  deckTitle: string
  tocSlide?: number
  sections: NavEntry[]
}

export const LAYOUTS: LayoutInfo[] = [
  { name: 'title', description: 'Cover slide with deck title and subtitle' },
  { name: 'toc', description: 'Contents slide linking to each section' },
  { name: 'section', description: 'Section divider with one large heading' },
  { name: 'bullets', description: 'Title above a bullet list' },
  { name: 'two-column', description: 'Two labeled columns of bullets' },
  { name: 'stat-callout', description: 'Row of large stats with captions' },
  { name: 'grid', description: 'Two-by-two cards, each a term and detail' },
  { name: 'quote', description: 'Large pull quote with attribution' },
  {
    name: 'freeform',
    description:
      'Explicit shapes at a declared position and size, for a figure the other layouts cannot draw',
  },
]

const LAYOUT_NAMES = new Set(LAYOUTS.map((layout) => layout.name))

export function isKnownLayout(name: string): boolean {
  return LAYOUT_NAMES.has(name)
}

const W = 13.333
const H = 7.5
const MX = 0.7
const CW = W - MX * 2
const BODY_Y = 1.7

const RENDERERS: Record<
  string,
  (s: PptxSlide, slide: Slide, theme: Theme) => void
> = {
  title: renderTitle,
  section: renderSection,
  bullets: renderBullets,
  'two-column': renderTwoColumn,
  'stat-callout': renderStatCallout,
  grid: renderGrid,
  quote: renderQuote,
  freeform: renderFreeform,
}

export function renderDeckSlide(
  s: PptxSlide,
  slide: Slide,
  theme: Theme,
): void {
  const renderer = RENDERERS[slide.layout] ?? renderBullets
  renderer(s, slide, theme)
}

export function renderToc(
  s: PptxSlide,
  slide: Slide,
  theme: Theme,
  nav: DeckNav,
): void {
  addTitle(s, slide.title || 'Contents', theme)
  if (nav.sections.length === 0) return
  s.addText(
    nav.sections.map((entry) => ({
      text: entry.title,
      options: { breakLine: true, hyperlink: { slide: entry.slideNumber } },
    })),
    {
      x: MX,
      y: BODY_Y,
      w: CW,
      h: 5,
      fontFace: FONTS.body,
      fontSize: TYPE.body + 2,
      color: theme.accent,
      valign: 'top',
      lineSpacingMultiple: 1.6,
    },
  )
}

export function addFooter(
  s: PptxSlide,
  slide: Slide,
  theme: Theme,
  nav: DeckNav,
): void {
  if (slide.layout === 'title' || slide.layout === 'toc') return
  if (nav.deckTitle) {
    s.addText(nav.deckTitle, {
      x: MX,
      y: H - 0.5,
      w: CW / 2,
      h: 0.3,
      fontFace: FONTS.body,
      fontSize: TYPE.caption,
      color: theme.muted,
      valign: 'middle',
    })
  }
  if (nav.tocSlide) {
    s.addText('Contents', {
      x: MX + CW / 2,
      y: H - 0.5,
      w: CW / 2,
      h: 0.3,
      fontFace: FONTS.body,
      fontSize: TYPE.caption,
      color: theme.muted,
      align: 'right',
      valign: 'middle',
      hyperlink: { slide: nav.tocSlide },
    })
  }
}

function renderTitle(s: PptxSlide, slide: Slide, theme: Theme): void {
  s.addText(clean(slide.title), {
    x: MX,
    y: 2.6,
    w: CW,
    h: 1.4,
    fontFace: FONTS.heading,
    fontSize: TYPE.cover,
    bold: true,
    color: theme.ink,
    valign: 'top',
  })
  const subtitle = slide.content.join(' ').trim()
  if (subtitle) {
    s.addText(clean(subtitle), {
      x: MX,
      y: 4.1,
      w: CW,
      h: 1,
      fontFace: FONTS.body,
      fontSize: TYPE.body + 4,
      color: theme.muted,
      valign: 'top',
    })
  }
}

function renderSection(s: PptxSlide, slide: Slide, theme: Theme): void {
  s.addText(clean(slide.title), {
    x: MX,
    y: 2.9,
    w: CW,
    h: 1.6,
    fontFace: FONTS.heading,
    fontSize: TYPE.section,
    bold: true,
    color: theme.accent,
    valign: 'middle',
  })
}

function renderBullets(s: PptxSlide, slide: Slide, theme: Theme): void {
  addTitle(s, slide.title, theme)
  const items = bullets(slide.content)
  if (items.length === 0) return
  s.addText(
    items.map((text) => ({
      text,
      options: { bullet: { code: '2022' }, breakLine: true },
    })),
    {
      x: MX,
      y: BODY_Y,
      w: CW,
      h: 5,
      fontFace: FONTS.body,
      fontSize: TYPE.body,
      color: theme.ink,
      valign: 'top',
      lineSpacingMultiple: 1.3,
      paraSpaceAfter: 10,
    },
  )
}

function renderTwoColumn(s: PptxSlide, slide: Slide, theme: Theme): void {
  addTitle(s, slide.title, theme)
  const cols = columns(slide.content)
  const gap = 0.6
  const colWidth = (CW - gap) / 2
  cols.slice(0, 2).forEach((col, index) => {
    const x = MX + index * (colWidth + gap)
    s.addText(col.heading, {
      x,
      y: BODY_Y,
      w: colWidth,
      h: 0.6,
      fontFace: FONTS.heading,
      fontSize: TYPE.body + 4,
      bold: true,
      color: theme.accent,
      valign: 'top',
    })
    if (col.items.length === 0) return
    s.addText(
      col.items.map((text) => ({
        text,
        options: { bullet: { code: '2022' }, breakLine: true },
      })),
      {
        x,
        y: BODY_Y + 0.7,
        w: colWidth,
        h: 4.3,
        fontFace: FONTS.body,
        fontSize: TYPE.body,
        color: theme.ink,
        valign: 'top',
        lineSpacingMultiple: 1.3,
        paraSpaceAfter: 8,
      },
    )
  })
}

function renderStatCallout(s: PptxSlide, slide: Slide, theme: Theme): void {
  addTitle(s, slide.title, theme)
  const stats = pairs(slide.content).slice(0, 4)
  if (stats.length === 0) return
  const gap = 0.5
  const cellWidth = (CW - gap * (stats.length - 1)) / stats.length
  stats.forEach((stat, index) => {
    const x = MX + index * (cellWidth + gap)
    s.addText(stat.left, {
      x,
      y: 2.6,
      w: cellWidth,
      h: 1.3,
      fontFace: FONTS.heading,
      fontSize: TYPE.stat,
      bold: true,
      color: theme.accent,
      align: 'left',
      valign: 'top',
    })
    s.addText(stat.right, {
      x,
      y: 3.9,
      w: cellWidth,
      h: 1.4,
      fontFace: FONTS.body,
      fontSize: TYPE.body,
      color: theme.muted,
      align: 'left',
      valign: 'top',
    })
  })
}

function renderGrid(s: PptxSlide, slide: Slide, theme: Theme): void {
  addTitle(s, slide.title, theme)
  const cards = pairs(slide.content).slice(0, 4)
  const gap = 0.5
  const cardWidth = (CW - gap) / 2
  const cardHeight = 2.1
  cards.forEach((card, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = MX + col * (cardWidth + gap)
    const y = BODY_Y + row * (cardHeight + gap)
    s.addShape('roundRect', {
      x,
      y,
      w: cardWidth,
      h: cardHeight,
      fill: { color: theme.surface },
      line: { type: 'none' },
      rectRadius: 0.08,
    })
    s.addText(card.left, {
      x: x + 0.3,
      y: y + 0.25,
      w: cardWidth - 0.6,
      h: 0.6,
      fontFace: FONTS.heading,
      fontSize: TYPE.body + 4,
      bold: true,
      color: theme.ink,
      valign: 'top',
    })
    s.addText(card.right, {
      x: x + 0.3,
      y: y + 0.95,
      w: cardWidth - 0.6,
      h: cardHeight - 1.2,
      fontFace: FONTS.body,
      fontSize: TYPE.body - 2,
      color: theme.ink,
      valign: 'top',
      lineSpacingMultiple: 1.2,
    })
  })
}

function renderQuote(s: PptxSlide, slide: Slide, theme: Theme): void {
  const lines = slide.content
  const attribution = lines.find((line) => /^(—|-)\s/.test(line.trim()))
  const quote = lines
    .filter((line) => line !== attribution)
    .join(' ')
    .trim()
  s.addText(clean(quote), {
    x: MX,
    y: 2.2,
    w: CW,
    h: 2.6,
    fontFace: FONTS.heading,
    fontSize: TYPE.quote,
    italic: true,
    color: theme.ink,
    valign: 'top',
    lineSpacingMultiple: 1.25,
  })
  if (attribution) {
    s.addText(clean(attribution.replace(/^(—|-)\s+/, '')), {
      x: MX,
      y: 5,
      w: CW,
      h: 0.6,
      fontFace: FONTS.body,
      fontSize: TYPE.body,
      bold: true,
      color: theme.accent,
      valign: 'top',
    })
  }
}

const SHAPE_KEYS = new Set(['x', 'y', 'w', 'h', 'color'])
const COLOR_ROLES: (keyof Theme)[] = [
  'background',
  'surface',
  'ink',
  'muted',
  'accent',
]

function renderFreeform(s: PptxSlide, slide: Slide, theme: Theme): void {
  addTitle(s, slide.title, theme)
  for (const line of slide.content) {
    if (!line.trim().startsWith('-')) throw malformedShape(slide.title, line)
    renderShapeLine(s, line, slide.title, theme)
  }
}

function malformedShape(title: string, line: string): Error {
  return new Error(
    `Malformed freeform shape on slide "${title}": ${line.trim()}`,
  )
}

function renderShapeLine(
  s: PptxSlide,
  line: string,
  title: string,
  theme: Theme,
): void {
  const stripped = line.replace(/^\s*-\s*/, '')
  const colonIndex = stripped.indexOf(':')
  const head = (
    colonIndex === -1 ? stripped : stripped.slice(0, colonIndex)
  ).trim()
  const text = colonIndex === -1 ? '' : stripped.slice(colonIndex + 1).trim()

  const tokens = head.split(/\s+/).filter(Boolean)
  const kind = tokens.shift()
  if (kind !== 'text' && kind !== 'rect') throw malformedShape(title, line)
  if (kind === 'text' && colonIndex === -1) throw malformedShape(title, line)

  const attrs: Record<string, string> = {}
  for (const token of tokens) {
    const match = token.match(/^(\w+)=(.+)$/)
    if (!match) throw malformedShape(title, line)
    if (!SHAPE_KEYS.has(match[1])) throw malformedShape(title, line)
    attrs[match[1]] = match[2]
  }

  const x = Number(attrs.x)
  const y = Number(attrs.y)
  const w = Number(attrs.w)
  const h = Number(attrs.h)
  if (![x, y, w, h].every(Number.isFinite)) throw malformedShape(title, line)

  const role = attrs.color as keyof Theme
  if (!COLOR_ROLES.includes(role)) throw malformedShape(title, line)
  const color = theme[role]

  if (kind === 'text') {
    s.addText(clean(text), {
      x,
      y,
      w,
      h,
      fontFace: FONTS.body,
      fontSize: TYPE.body,
      color,
      valign: 'top',
    })
  } else {
    s.addShape('rect', { x, y, w, h, fill: { color } })
  }
}

function addTitle(s: PptxSlide, title: string, theme: Theme): void {
  if (!title) return
  s.addText(clean(title), {
    x: MX,
    y: 0.5,
    w: CW,
    h: 0.9,
    fontFace: FONTS.heading,
    fontSize: TYPE.title,
    bold: true,
    color: theme.ink,
    valign: 'top',
  })
}

function clean(text: string): string {
  return text.replace(/\*\*/g, '').replace(/`/g, '').trim()
}

function bullets(content: string[]): string[] {
  return content
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => clean(line.replace(/^\s*-\s+/, '')))
}

function pairs(content: string[]): { left: string; right: string }[] {
  return content
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.replace(/^\s*-\s+/, ''))
    .map((line) => {
      const [left, ...rest] = line.split(/\s*:\s*/)
      return { left: clean(left), right: clean(rest.join(': ')) }
    })
}

function columns(content: string[]): { heading: string; items: string[] }[] {
  const cols: { heading: string; items: string[] }[] = []
  for (const line of content) {
    const heading = line.match(/^##\s+(.+)/)
    if (heading) {
      cols.push({ heading: clean(heading[1]), items: [] })
      continue
    }
    if (line.trim().startsWith('-') && cols.length > 0) {
      cols[cols.length - 1].items.push(clean(line.replace(/^\s*-\s+/, '')))
    }
  }
  return cols
}
