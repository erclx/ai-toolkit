import { describe, expect, it } from 'vitest'
import { parseNumber } from '@/counts/numbers'

describe('parseNumber', () => {
  it('should read a bare digit run', () => {
    expect(parseNumber('63')).toBe(63)
  })

  it('should read a single-word cardinal', () => {
    expect(parseNumber('six')).toBe(6)
    expect(parseNumber('fifteen')).toBe(15)
    expect(parseNumber('sixty')).toBe(60)
  })

  it('should read a hyphenated compound cardinal', () => {
    expect(parseNumber('sixty-one')).toBe(61)
    expect(parseNumber('ninety-nine')).toBe(99)
  })

  it('should read a cardinal case-insensitively', () => {
    expect(parseNumber('Six')).toBe(6)
    expect(parseNumber('Sixty-One')).toBe(61)
  })

  it('should return undefined for a word carrying no number', () => {
    expect(parseNumber('several')).toBeUndefined()
  })
})
