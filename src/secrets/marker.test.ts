import { describe, expect, it } from 'vitest'
import { isExempt, SECRET_MARKER } from '@/secrets/marker'

describe('isExempt', () => {
  it('should exempt a line carrying the marker with a reason', () => {
    const lines = [`const key = "x" // ${SECRET_MARKER}: sandbox fixture`]

    expect(isExempt(lines, 0)).toBe(true)
  })

  it('should exempt a line whose predecessor carries the marker', () => {
    const lines = [`# ${SECRET_MARKER}: sandbox fixture`, 'const key = "x"']

    expect(isExempt(lines, 1)).toBe(true)
  })

  it('should not reach a line two below the marker', () => {
    const lines = [`# ${SECRET_MARKER}: sandbox fixture`, 'filler', 'key = "x"']

    expect(isExempt(lines, 2)).toBe(false)
  })

  it('should refuse a marker carrying no reason', () => {
    expect(isExempt([`key = "x" // ${SECRET_MARKER}:`], 0)).toBe(false)
  })

  it('should refuse a marker whose reason is only whitespace', () => {
    expect(isExempt([`key = "x" // ${SECRET_MARKER}:   `], 0)).toBe(false)
  })

  it('should refuse a marker missing its colon', () => {
    expect(isExempt([`key = "x" // ${SECRET_MARKER} fixture`], 0)).toBe(false)
  })

  it('should refuse a near-miss spelling of the marker', () => {
    expect(isExempt(['key = "x" // canon-allow-secrets: fixture'], 0)).toBe(
      false,
    )
  })

  it('should report no exemption on a tree carrying no marker', () => {
    const lines = ['const a = 1', 'const b = 2']

    expect(lines.map((_, index) => isExempt(lines, index))).toEqual([
      false,
      false,
    ])
  })
})
