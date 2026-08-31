import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseSlides } from '@/slides/parse'
import { buildNav, renderSlidesDoc } from '@/slides/render'

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

describe('renderSlidesDoc', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'render-slides-'))
  })

  afterEach(() => {
    rmSync(root, { force: true, recursive: true })
  })

  it('reports no unrecognized layouts for a deck of catalog names', async () => {
    const source = join(root, 'SLIDES.md')
    writeFileSync(source, '# One\nlayout: title\n')
    const result = await renderSlidesDoc(source, join(root, 'out'))
    expect(result.unrecognizedLayouts).toEqual([])
  })

  it('collects an unrecognized layout with the slide it sits on', async () => {
    const source = join(root, 'SLIDES.md')
    writeFileSync(
      source,
      '# One\nlayout: mystery\n- a\n\n---\n\n# Two\nlayout: title\n',
    )
    const result = await renderSlidesDoc(source, join(root, 'out'))
    expect(result.unrecognizedLayouts).toEqual([
      { value: 'mystery', slideNumbers: [1] },
    ])
  })

  it('collapses duplicate unrecognized values into one entry', async () => {
    const source = join(root, 'SLIDES.md')
    writeFileSync(
      source,
      '# One\nlayout: mystery\n- a\n\n---\n\n# Two\nlayout: mystery\n- b\n',
    )
    const result = await renderSlidesDoc(source, join(root, 'out'))
    expect(result.unrecognizedLayouts).toEqual([
      { value: 'mystery', slideNumbers: [1, 2] },
    ])
  })
})
