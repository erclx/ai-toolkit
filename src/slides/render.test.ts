import { describe, expect, it } from 'vitest'
import { parseSlides } from '@/slides/parse'
import { buildNav } from '@/slides/render'

describe('buildNav', () => {
  it('maps the contents slide and section numbers', () => {
    const deck = parseSlides(
      '---\ntitle: D\n---\n\n# Cover\nlayout: title\n\n---\n\n# Contents\nlayout: toc\n\n---\n\n# One\nlayout: section\n\n---\n\n# Two\nlayout: section\n',
    )
    const nav = buildNav(deck)
    expect(nav.deckTitle).toBe('D')
    expect(nav.tocSlide).toBe(2)
    expect(nav.sections).toEqual([
      { title: 'One', slideNumber: 3 },
      { title: 'Two', slideNumber: 4 },
    ])
  })

  it('leaves the toc slide undefined when no contents slide exists', () => {
    const deck = parseSlides('# One\nlayout: section\n')
    const nav = buildNav(deck)
    expect(nav.tocSlide).toBeUndefined()
    expect(nav.sections).toEqual([{ title: 'One', slideNumber: 1 }])
  })
})
