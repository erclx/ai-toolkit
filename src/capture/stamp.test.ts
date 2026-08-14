import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatStamp, hashSource, stampPath } from '@/capture/stamp'

const EMPTY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

describe('stampPath', () => {
  it('should name the stamp after the png beside it', () => {
    expect(stampPath(join('assets', 'hero.png'))).toBe(
      join('assets', 'hero.stamp'),
    )
  })

  it('should follow the png into an explicit output directory', () => {
    expect(stampPath(join('/out', 'hero.png'))).toBe(join('/out', 'hero.stamp'))
  })
})

describe('hashSource', () => {
  it('should digest the bytes it is given', () => {
    expect(hashSource(new Uint8Array())).toBe(EMPTY_SHA256)
  })

  it('should move on a whitespace-only difference', () => {
    const encoder = new TextEncoder()

    expect(hashSource(encoder.encode('<p>7</p>'))).not.toBe(
      hashSource(encoder.encode('<p>7</p> ')),
    )
  })
})

describe('formatStamp', () => {
  it('should write the two fields the verify stage reads back', () => {
    const text = formatStamp({ source: 'hero.html', sha256: EMPTY_SHA256 })

    expect(text).toBe(`source: hero.html\nsha256: ${EMPTY_SHA256}\n`)
  })
})
