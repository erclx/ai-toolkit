import { describe, expect, it } from 'vitest'
import {
  addFooter,
  type DeckNav,
  isKnownLayout,
  LAYOUTS,
  renderDeckSlide,
  renderToc,
} from '@/slides/layouts'
import type { Slide } from '@/slides/parse'
import { buildTheme } from '@/slides/styles'

type RenderTarget = Parameters<typeof renderDeckSlide>[0]

interface Recording {
  target: RenderTarget
  texts: string[]
  shapes: string[]
  textOptions: Record<string, unknown>[]
  shapeOptions: Record<string, unknown>[]
}

function recorder(): Recording {
  const texts: string[] = []
  const shapes: string[] = []
  const textOptions: Record<string, unknown>[] = []
  const shapeOptions: Record<string, unknown>[] = []
  const stub = {
    addText(content: unknown, options?: Record<string, unknown>) {
      if (typeof content === 'string') {
        texts.push(content)
      } else if (Array.isArray(content)) {
        for (const run of content) texts.push((run as { text: string }).text)
      }
      if (options) textOptions.push(options)
    },
    addShape(name: string, options?: Record<string, unknown>) {
      shapes.push(name)
      if (options) shapeOptions.push(options)
    },
  }
  return {
    target: stub as unknown as RenderTarget,
    texts,
    shapes,
    textOptions,
    shapeOptions,
  }
}

const theme = buildTheme('light')

function slide(partial: Partial<Slide>): Slide {
  return { layout: 'bullets', title: '', content: [], ...partial }
}

describe('LAYOUTS catalog', () => {
  it('exposes the named layouts', () => {
    expect(LAYOUTS.map((layout) => layout.name)).toEqual([
      'title',
      'toc',
      'section',
      'bullets',
      'two-column',
      'stat-callout',
      'grid',
      'quote',
      'freeform',
    ])
  })
})

describe('renderToc and addFooter', () => {
  const nav: DeckNav = {
    deckTitle: 'My Deck',
    tocSlide: 2,
    sections: [
      { title: 'Intro', slideNumber: 3 },
      { title: 'Results', slideNumber: 5 },
    ],
  }

  it('lists each section as a contents entry', () => {
    const { target, texts } = recorder()
    renderToc(target, slide({ layout: 'toc', title: 'Contents' }), theme, nav)
    expect(texts).toContain('Intro')
    expect(texts).toContain('Results')
  })

  it('stamps the deck title and a contents link on a content slide', () => {
    const { target, texts } = recorder()
    addFooter(target, slide({ layout: 'bullets' }), theme, nav)
    expect(texts).toContain('My Deck')
    expect(texts).toContain('Contents')
  })

  it('skips the footer on the cover slide', () => {
    const { target, texts } = recorder()
    addFooter(target, slide({ layout: 'title' }), theme, nav)
    expect(texts).not.toContain('Contents')
  })

  it('skips the footer on the contents slide', () => {
    const { target, texts } = recorder()
    addFooter(target, slide({ layout: 'toc' }), theme, nav)
    expect(texts).not.toContain('Contents')
  })
})

describe('renderDeckSlide', () => {
  it('renders the title and each bullet for a bullets slide', () => {
    const { target, texts } = recorder()
    renderDeckSlide(
      target,
      slide({
        layout: 'bullets',
        title: 'Agenda',
        content: ['- first', '- second'],
      }),
      theme,
    )
    expect(texts).toContain('Agenda')
    expect(texts).toContain('first')
    expect(texts).toContain('second')
  })

  it('splits a stat into its number and caption', () => {
    const { target, texts } = recorder()
    renderDeckSlide(
      target,
      slide({
        layout: 'stat-callout',
        content: ['- 7 : layouts in the catalog'],
      }),
      theme,
    )
    expect(texts).toContain('7')
    expect(texts).toContain('layouts in the catalog')
  })

  it('draws a rounded card per grid item', () => {
    const { target, shapes } = recorder()
    renderDeckSlide(
      target,
      slide({ layout: 'grid', content: ['- **One** : a', '- **Two** : b'] }),
      theme,
    )
    expect(shapes).toEqual(['roundRect', 'roundRect'])
  })

  it('renders both column headings for two-column', () => {
    const { target, texts } = recorder()
    renderDeckSlide(
      target,
      slide({
        layout: 'two-column',
        content: ['## Left', '- a', '## Right', '- b'],
      }),
      theme,
    )
    expect(texts).toContain('Left')
    expect(texts).toContain('Right')
  })

  it('strips bold markers from rendered text', () => {
    const { target, texts } = recorder()
    renderDeckSlide(
      target,
      slide({ layout: 'bullets', content: ['- **bold** point'] }),
      theme,
    )
    expect(texts).toContain('bold point')
  })

  it('falls back to the bullets layout for an unknown layout', () => {
    const { target, texts } = recorder()
    renderDeckSlide(
      target,
      slide({ layout: 'mystery', content: ['- still shown'] }),
      theme,
    )
    expect(texts).toContain('still shown')
  })

  it('places a freeform text shape at its declared position with the resolved color', () => {
    const { target, texts, textOptions } = recorder()
    renderDeckSlide(
      target,
      slide({
        layout: 'freeform',
        content: ['- text x=1 y=2 w=3 h=0.5 color=ink: Caption'],
      }),
      theme,
    )
    expect(texts).toContain('Caption')
    expect(textOptions).toContainEqual(
      expect.objectContaining({ x: 1, y: 2, w: 3, h: 0.5, color: theme.ink }),
    )
  })

  it('draws a freeform rect shape at its declared position with the resolved color', () => {
    const { target, shapes, shapeOptions } = recorder()
    renderDeckSlide(
      target,
      slide({
        layout: 'freeform',
        content: ['- rect x=0.5 y=0.5 w=4 h=2 color=accent'],
      }),
      theme,
    )
    expect(shapes).toEqual(['rect'])
    expect(shapeOptions).toContainEqual(
      expect.objectContaining({
        x: 0.5,
        y: 0.5,
        w: 4,
        h: 2,
        fill: { color: theme.accent },
      }),
    )
  })

  it('throws on a malformed freeform shape line', () => {
    expect(() =>
      renderDeckSlide(
        recorder().target,
        slide({
          layout: 'freeform',
          title: 'Bad slide',
          content: ['- oval x=1 y=1 w=1 h=1 color=ink'],
        }),
        theme,
      ),
    ).toThrow(/Bad slide/)
  })

  it('throws on an unparsable freeform coordinate', () => {
    expect(() =>
      renderDeckSlide(
        recorder().target,
        slide({
          layout: 'freeform',
          content: ['- rect x=nope y=1 w=1 h=1 color=ink'],
        }),
        theme,
      ),
    ).toThrow()
  })

  it('throws on an unknown freeform color role', () => {
    expect(() =>
      renderDeckSlide(
        recorder().target,
        slide({
          layout: 'freeform',
          content: ['- rect x=1 y=1 w=1 h=1 color=blue'],
        }),
        theme,
      ),
    ).toThrow()
  })
})

describe('isKnownLayout', () => {
  it('accepts every name in the catalog', () => {
    for (const layout of LAYOUTS) {
      expect(isKnownLayout(layout.name)).toBe(true)
    }
  })

  it('rejects a name outside the catalog', () => {
    expect(isKnownLayout('mystery')).toBe(false)
  })
})
