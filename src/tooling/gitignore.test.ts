import { describe, expect, it } from 'vitest'
import { mergeSections, pruneSections } from '@/tooling/gitignore'

const SYSTEM = { header: '# System', entries: ['.DS_Store', 'Thumbs.db'] }

describe('mergeSections', () => {
  it('should write the header when the whole section is missing', () => {
    const result = mergeSections('', [SYSTEM])

    expect(result.content).toBe('\n# System\n.DS_Store\nThumbs.db\n')
    expect(result.added).toEqual(['.DS_Store', 'Thumbs.db'])
  })

  it('should append bare entries when the section is only partly present', () => {
    const result = mergeSections('# System\n.DS_Store\n', [SYSTEM])

    expect(result.content).toBe('# System\n.DS_Store\nThumbs.db\n')
    expect(result.added).toEqual(['Thumbs.db'])
  })

  it('should change nothing when every entry is already present', () => {
    const existing = '# System\n.DS_Store\nThumbs.db\n'

    const result = mergeSections(existing, [SYSTEM])

    expect(result.content).toBe(existing)
    expect(result.added).toEqual([])
  })

  it('should treat a trailing slash as the same entry', () => {
    const result = mergeSections('node_modules\n', [
      { header: '# Deps', entries: ['node_modules/'] },
    ])

    expect(result.added).toEqual([])
  })

  it('should not add an entry twice across sections', () => {
    const result = mergeSections('', [
      { header: '# One', entries: ['dist'] },
      { header: '# Two', entries: ['dist'] },
    ])

    expect(result.added).toEqual(['dist'])
  })

  it('should be idempotent when applied to its own output', () => {
    const once = mergeSections('', [SYSTEM])
    const twice = mergeSections(once.content, [SYSTEM])

    expect(twice.content).toBe(once.content)
    expect(twice.added).toEqual([])
  })
})

describe('pruneSections', () => {
  it('should remove an entry no longer in the manifest', () => {
    const result = pruneSections('# System\n.DS_Store\nstale\n', [SYSTEM])

    expect(result.content).toBe('# System\n.DS_Store\n')
    expect(result.removed).toEqual(['stale'])
  })

  it('should stop at a blank line ending the section', () => {
    const result = pruneSections('# System\n.DS_Store\n\nkeep-me\n', [SYSTEM])

    expect(result.removed).toEqual([])
  })

  it('should stop at the next comment header', () => {
    const result = pruneSections('# System\n.DS_Store\n# Other\nkeep-me\n', [
      SYSTEM,
    ])

    expect(result.removed).toEqual([])
  })

  it('should leave content untouched when nothing is removed', () => {
    const existing = '# Unmanaged\nwhatever\n'

    expect(pruneSections(existing, [SYSTEM]).content).toBe(existing)
  })

  it('should ignore entries outside any managed header', () => {
    const result = pruneSections('loose-entry\n# System\n.DS_Store\n', [SYSTEM])

    expect(result.removed).toEqual([])
  })
})
