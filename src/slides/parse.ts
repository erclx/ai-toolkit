import { readFileSync } from 'node:fs'
import type { Variant } from '@/slides/styles'

export interface DeckMeta {
  title: string
  variant: Variant
}

export interface Slide {
  layout: string
  title: string
  content: string[]
}

export interface Deck {
  meta: DeckMeta
  slides: Slide[]
}

const DEFAULT_META: DeckMeta = {
  title: '',
  variant: 'light',
}

export function parseSlidesDoc(path: string): Deck {
  return parseSlides(readFileSync(path, 'utf8'))
}

export function parseSlides(raw: string): Deck {
  const { meta, body } = splitFrontmatter(raw)
  const slides = body
    .split(/^---\s*$/m)
    .map(parseSlide)
    .filter((slide): slide is Slide => slide !== null)
  return { meta, slides }
}

function splitFrontmatter(raw: string): { meta: DeckMeta; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { meta: { ...DEFAULT_META }, body: raw }
  return { meta: parseMeta(match[1]), body: raw.slice(match[0].length) }
}

function parseMeta(block: string): DeckMeta {
  const meta: DeckMeta = { ...DEFAULT_META }
  for (const line of block.split('\n')) {
    const match = line.match(/^(\w+):\s*(.+?)\s*$/)
    if (!match) continue
    const [, key, value] = match
    if (key === 'title') meta.title = value
    if (key === 'variant' && (value === 'light' || value === 'dark')) {
      meta.variant = value
    }
  }
  return meta
}

function parseSlide(chunk: string): Slide | null {
  let title = ''
  let layout = ''
  const content: string[] = []
  for (const line of chunk.split('\n')) {
    const heading = line.match(/^#\s+(.+?)\s*$/)
    const declared = line.match(/^layout:\s*(.+?)\s*$/)
    if (heading && !title) {
      title = heading[1]
      continue
    }
    if (declared && !layout) {
      layout = declared[1].trim()
      continue
    }
    content.push(line)
  }
  const trimmed = content.filter((line) => line.trim())
  if (!title && !layout && trimmed.length === 0) return null
  return { layout: layout || inferLayout(trimmed), title, content: trimmed }
}

function inferLayout(content: string[]): string {
  return content.some((line) => line.trim().startsWith('-'))
    ? 'bullets'
    : 'title'
}
