import { describe, expect, it } from 'vitest'
import { DEFAULT_CURSORS } from '@/demo/cursors'
import { cursorHotspot, pointerSource, scaleHotspot } from '@/demo/pointer'

/**
 * Builds a Windows cursor resource carrying only its header and directory, which
 * is all `cursorHotspot` reads. The pixel payload each entry points at is never
 * decoded here, so a fixture does not have to carry one.
 */
function cursorFile(
  entries: { size: number; hotspotX: number; hotspotY: number }[],
): Uint8Array {
  const bytes = new Uint8Array(6 + entries.length * 16)
  const view = new DataView(bytes.buffer)
  view.setUint16(2, 2, true)
  view.setUint16(4, entries.length, true)
  entries.forEach((entry, index) => {
    const at = 6 + index * 16
    bytes[at] = entry.size
    bytes[at + 1] = entry.size
    view.setUint16(at + 4, entry.hotspotX, true)
    view.setUint16(at + 6, entry.hotspotY, true)
  })
  return bytes
}

describe('cursorHotspot', () => {
  it('should read the hotspot of a single-entry cursor', () => {
    const file = cursorFile([{ size: 48, hotspotX: 3, hotspotY: 6 }])

    expect(cursorHotspot(file)).toEqual({
      width: 48,
      height: 48,
      hotspotX: 3,
      hotspotY: 6,
    })
  })

  it('should pick the largest entry rather than the first', () => {
    const file = cursorFile([
      { size: 32, hotspotX: 2, hotspotY: 4 },
      { size: 48, hotspotX: 3, hotspotY: 6 },
    ])

    expect(cursorHotspot(file)).toMatchObject({ width: 48, hotspotX: 3 })
  })

  it('should read a zero size byte as the 256 the format means by it', () => {
    const file = cursorFile([{ size: 0, hotspotX: 1, hotspotY: 1 }])

    expect(cursorHotspot(file)).toMatchObject({ width: 256, height: 256 })
  })

  it('should refuse a file whose type is not a cursor', () => {
    const file = cursorFile([{ size: 48, hotspotX: 3, hotspotY: 6 }])
    new DataView(file.buffer).setUint16(2, 1, true)

    expect(cursorHotspot(file)).toBeUndefined()
  })

  it('should refuse a file too short to hold a directory entry', () => {
    expect(cursorHotspot(new Uint8Array(4))).toBeUndefined()
  })

  it('should refuse a file declaring no entry', () => {
    expect(cursorHotspot(cursorFile([]))).toBeUndefined()
  })
})

describe('scaleHotspot', () => {
  it('should scale the hotspot by the ratio between drawn and source size', () => {
    const scaled = scaleHotspot(
      { width: 48, height: 48, hotspotX: 24, hotspotY: 12 },
      24,
    )

    expect(scaled).toEqual({ x: 12, y: 6 })
  })

  it('should leave the hotspot alone when the drawn size matches the source', () => {
    const scaled = scaleHotspot(
      { width: 32, height: 32, hotspotX: 3, hotspotY: 6 },
      32,
    )

    expect(scaled).toEqual({ x: 3, y: 6 })
  })
})

describe('pointerSource', () => {
  it('should embed artwork for every state the page can select', () => {
    const source = pointerSource(DEFAULT_CURSORS, 32)

    expect(
      Object.keys(DEFAULT_CURSORS).every((state) => source.includes(state)),
    ).toBe(true)
  })

  it('should carry the scaled hotspot rather than the raw one', () => {
    const source = pointerSource(
      {
        default: {
          image: 'data:image/svg+xml,x',
          hotspot: { width: 48, height: 48, hotspotX: 24, hotspotY: 24 },
        },
      },
      24,
    )

    expect(source).toContain('"x":12')
  })

  it('should draw at the size it was asked for', () => {
    const source = pointerSource(DEFAULT_CURSORS, 40)

    expect(source).toContain('40')
  })
})

describe('DEFAULT_CURSORS', () => {
  it('should ship the three states the recorder selects between', () => {
    expect(Object.keys(DEFAULT_CURSORS).sort()).toEqual([
      'default',
      'pointer',
      'text',
    ])
  })

  it('should carry inline artwork rather than a path to a machine', () => {
    expect(
      Object.values(DEFAULT_CURSORS).every((cursor) =>
        cursor.image.startsWith('data:'),
      ),
    ).toBe(true)
  })

  /**
   * A repeated attribute makes the markup invalid, and an invalid data URI in an
   * image element renders as a broken-image glyph rather than raising, so the
   * recording carries a broken icon where the pointer should be.
   */
  it('should draw every state with no element repeating an attribute', () => {
    const repeated = Object.entries(DEFAULT_CURSORS).filter(([, cursor]) =>
      elementsOf(cursor.image).some(hasRepeatedAttribute),
    )

    expect(repeated.map(([state]) => state)).toEqual([])
  })
})

function elementsOf(dataUri: string): string[] {
  const markup = decodeURIComponent(dataUri.replace(/^data:[^,]*,/, ''))
  return markup.match(/<[a-zA-Z][^>]*>/g) ?? []
}

function hasRepeatedAttribute(element: string): boolean {
  const names = (element.match(/[a-zA-Z-]+(?==")/g) ?? []).map((name) =>
    name.toLowerCase(),
  )
  return new Set(names).size !== names.length
}
