import { copyFileSync, mkdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import PptxGenJS from 'pptxgenjs'
import {
  addFooter,
  type DeckNav,
  isKnownLayout,
  renderDeckSlide,
  renderToc,
} from '@/slides/layouts'
import { type Deck, parseSlidesDoc } from '@/slides/parse'
import { buildTheme, type Variant } from '@/slides/styles'

export interface UnrecognizedLayout {
  value: string
  slideNumbers: number[]
}

export interface RenderResult {
  pptxPath: string
  mirrorPath?: string
  slideCount: number
  unrecognizedLayouts: UnrecognizedLayout[]
}

export interface RenderOptions {
  variant?: Variant
  mirror?: string
}

export async function renderSlidesDoc(
  sourcePath: string,
  outDir: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const deck = parseSlidesDoc(sourcePath)
  const variant = options.variant ?? deck.meta.variant
  const theme = buildTheme(variant)

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  if (deck.meta.title) pptx.title = deck.meta.title

  const nav = buildNav(deck)
  const unrecognizedSlideNumbers = new Map<string, number[]>()
  deck.slides.forEach((slide, index) => {
    const target = pptx.addSlide()
    target.background = { color: theme.background }
    if (!isKnownLayout(slide.layout)) {
      const slideNumbers = unrecognizedSlideNumbers.get(slide.layout) ?? []
      slideNumbers.push(index + 1)
      unrecognizedSlideNumbers.set(slide.layout, slideNumbers)
    }
    if (slide.layout === 'toc') {
      renderToc(target, slide, theme, nav)
    } else {
      renderDeckSlide(target, slide, theme)
    }
    addFooter(target, slide, theme, nav)
  })

  mkdirSync(outDir, { recursive: true })
  const fileName = outputName(sourcePath)
  const pptxPath = join(outDir, fileName)
  await pptx.writeFile({ fileName: pptxPath })

  const mirrorPath = options.mirror
    ? mirrorDeck(pptxPath, options.mirror, fileName)
    : undefined
  const unrecognizedLayouts = Array.from(
    unrecognizedSlideNumbers,
    ([value, slideNumbers]) => ({ value, slideNumbers }),
  )
  return {
    pptxPath,
    mirrorPath,
    slideCount: deck.slides.length,
    unrecognizedLayouts,
  }
}

function mirrorDeck(
  pptxPath: string,
  mirrorDir: string,
  fileName: string,
): string {
  mkdirSync(mirrorDir, { recursive: true })
  const mirrorPath = join(mirrorDir, fileName)
  copyFileSync(pptxPath, mirrorPath)
  return mirrorPath
}

export function buildNav(deck: Deck): DeckNav {
  let tocSlide: number | undefined
  const sections: DeckNav['sections'] = []
  deck.slides.forEach((slide, index) => {
    const slideNumber = index + 1
    if (slide.layout === 'toc' && tocSlide === undefined) {
      tocSlide = slideNumber
    }
    if (slide.layout === 'section') {
      sections.push({ title: slide.title, slideNumber })
    }
  })
  return { deckTitle: deck.meta.title, tocSlide, sections }
}

function outputName(sourcePath: string): string {
  return basename(sourcePath).replace(/\.md$/, '') + '.pptx'
}
