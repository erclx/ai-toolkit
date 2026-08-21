import { describe, expect, it } from 'vitest'
import { matchCursorFiles } from '@/demo/theme'

describe('matchCursorFiles', () => {
  it('should match a windows theme naming its files after the pointer states', () => {
    const matched = matchCursorFiles([
      'Arrow.cur',
      'Link.cur',
      'IBeam.cur',
      'Wait.ani',
    ])

    expect(matched).toEqual({
      default: 'Arrow.cur',
      pointer: 'Link.cur',
      text: 'IBeam.cur',
    })
  })

  it('should match names in any case', () => {
    const matched = matchCursorFiles(['arrow.cur', 'hand.cur', 'beam.cur'])

    expect(matched).toMatchObject({ default: 'arrow.cur', pointer: 'hand.cur' })
  })

  it('should ignore an animated cursor, which has no still frame to draw', () => {
    const matched = matchCursorFiles(['Arrow.ani', 'Arrow.cur'])

    expect(matched.default).toBe('Arrow.cur')
  })

  it('should leave a state unmatched rather than guessing at an unrelated file', () => {
    const matched = matchCursorFiles(['Arrow.cur'])

    expect(matched.pointer).toBeUndefined()
  })

  it('should prefer an exact state name over a longer one containing it', () => {
    const matched = matchCursorFiles(['Arrow Alternate.cur', 'Arrow.cur'])

    expect(matched.default).toBe('Arrow.cur')
  })

  it('should match nothing in a folder holding no cursor resource', () => {
    expect(matchCursorFiles(['readme.txt', 'preview.png'])).toEqual({})
  })
})
