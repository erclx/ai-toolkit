import { describe, expect, it } from 'vitest'
import { parseUnknownWords, scanTitleSpelling } from '@/labels/spelling'

// cspell:disable-next-line
const UNKNOWN_WORD = 'extensionlessqwerty'

describe('scanTitleSpelling', () => {
  it('should report a word no dictionary holds', async () => {
    const result = await scanTitleSpelling(
      `feat: fix the ${UNKNOWN_WORD} thing`,
      process.cwd(),
    )

    expect(result).toEqual({
      kind: 'checked',
      unknownWords: [UNKNOWN_WORD],
    })
  })

  it('should report an empty list for a conventional title', async () => {
    const result = await scanTitleSpelling(
      'feat(labels): add a fourth check to canon labels scan',
      process.cwd(),
    )

    expect(result).toEqual({ kind: 'checked', unknownWords: [] })
  })
})

describe('parseUnknownWords', () => {
  it('should split cleanly on newlines', () => {
    expect(parseUnknownWords('foo\nbar\n')).toEqual(['foo', 'bar'])
  })

  it('should drop blank lines', () => {
    expect(parseUnknownWords('foo\n\n\nbar\n')).toEqual(['foo', 'bar'])
  })

  it('should report an empty list for empty output', () => {
    expect(parseUnknownWords('')).toEqual([])
  })
})
