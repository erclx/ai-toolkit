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
}

function recorder(): Recording {
  const texts: string[] = []
  const shapes: string[] = []
  const stub = {
    addText(content: unknown) {
      if (typeof content === 'string') {
        texts.push(content)
      } else if (Array.isArray(content)) {
        for (const run of content) texts.push((run as { text: string }).text)
      }
    },
    addShape(name: string) {
      shapes.push(name)
    },
  }
  return { target: stub as unknown as RenderTarget, texts, shapes }
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
