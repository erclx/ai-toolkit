import { describe, expect, it } from 'vitest'
import { findBacktickSpans } from '@/markdown/backticks'

describe('findBacktickSpans', () => {
  it('should pair a single well-formed span', () => {
    expect(
      findBacktickSpans('Read `src/pr/paths.ts` for the tokenizer.'),
    ).toEqual([{ start: 5, end: 22, content: 'src/pr/paths.ts' }])
  })

  it('should pair a doubled-backtick delimiter with its matching close', () => {
    expect(findBacktickSpans('Reading ``git status``, then continue.')).toEqual(
      [{ start: 8, end: 22, content: 'git status' }],
    )
  })

  it('should leave an unmatched opening run as literal text and still pair what follows', () => {
    expect(
      findBacktickSpans('An unmatched `` opener, then `content` after.'),
    ).toEqual([{ start: 29, end: 38, content: 'content' }])
  })

  it('should pair adjacent spans of two different run lengths independently', () => {
    expect(
      findBacktickSpans('Reading ``a, b`` then rewrite `src/pr/paths.ts`.'),
    ).toEqual([
      { start: 8, end: 16, content: 'a, b' },
      { start: 30, end: 47, content: 'src/pr/paths.ts' },
    ])
  })
})
