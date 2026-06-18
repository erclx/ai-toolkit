import { describe, expect, it } from 'vitest'
import { parseSlides } from '@/slides/parse'

describe('parseSlides', () => {
  it('reads deck frontmatter into meta', () => {
    const source =
      '---\ntitle: My Deck\nvariant: dark\n---\n\n# Cover\nlayout: title\n'
    const deck = parseSlides(source)
    expect(deck.meta).toEqual({ title: 'My Deck', variant: 'dark' })
  })

  it('defaults variant to light when frontmatter is absent', () => {
    const deck = parseSlides('# Cover\nlayout: title\n')
    expect(deck.meta.variant).toBe('light')
  })

  it('splits slides on horizontal rules', () => {
    const source = '# One\nlayout: section\n\n---\n\n# Two\nlayout: section\n'
    const deck = parseSlides(source)
    expect(deck.slides.map((slide) => slide.title)).toEqual(['One', 'Two'])
  })

  it('reads the declared layout and title per slide', () => {
    const deck = parseSlides('# Agenda\nlayout: bullets\n\n- first\n- second\n')
    const [slide] = deck.slides
    expect(slide.layout).toBe('bullets')
    expect(slide.title).toBe('Agenda')
    expect(slide.content).toEqual(['- first', '- second'])
  })

  it('infers bullets when content has list items and no declared layout', () => {
    const deck = parseSlides('# Points\n\n- only point\n')
    expect(deck.slides[0].layout).toBe('bullets')
  })

  it('infers title when a slide has no list items and no declared layout', () => {
    const deck = parseSlides('# Just a heading\n\nA sentence of prose.\n')
    expect(deck.slides[0].layout).toBe('title')
  })

  it('ignores an invalid variant value', () => {
    const deck = parseSlides('---\nvariant: neon\n---\n\n# Cover\n')
    expect(deck.slides[0].layout).toBe('title')
    expect(deck.meta.variant).toBe('light')
  })

  it('drops empty chunks between rules', () => {
    const deck = parseSlides(
      '# One\nlayout: section\n\n---\n\n---\n\n# Two\nlayout: section\n',
    )
    expect(deck.slides).toHaveLength(2)
  })
})
