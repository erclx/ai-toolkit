import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatStamp, hashSource, stampPath } from '@/capture/stamp'

const EMPTY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
const IMAGE_SHA256 =
  'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb'

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
  it('should write the three fields the verify stage reads back', () => {
    const text = formatStamp({
      source: 'hero.html',
      sourceSha256: EMPTY_SHA256,
      imageSha256: IMAGE_SHA256,
    })

    expect(text).toBe(
      `source: hero.html\nsource-sha256: ${EMPTY_SHA256}\nimage-sha256: ${IMAGE_SHA256}\n`,
    )
  })

  it('should keep the two digests on separate fields', () => {
    const text = formatStamp({
      source: 'hero.html',
      sourceSha256: EMPTY_SHA256,
      imageSha256: IMAGE_SHA256,
    })

    expect(text).toContain(`source-sha256: ${EMPTY_SHA256}`)
    expect(text).toContain(`image-sha256: ${IMAGE_SHA256}`)
  })
})
