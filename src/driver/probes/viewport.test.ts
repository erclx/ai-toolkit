import { describe, expect, it } from 'vitest'
import { describeViewport, resolveViewports } from '@/driver/probes/viewport'

/**
 * Pins the refusal rather than a reading, because refusing is the whole of this
 * module's contract. A scroll rail that skipped its middle sections passed at
 * 900 and failed at 1200 and 1500, so any default height this shipped would be
 * inherited unchosen by every later caller and would report clean over exactly
 * that defect.
 */

describe('resolveViewports', () => {
  it('should refuse a run that declares no viewport at all', () => {
    const read = resolveViewports(undefined)

    expect(read).toMatchObject({ kind: 'refused', reason: 'no-viewport' })
  })

  it('should refuse a viewport carrying no width to wrap at', () => {
    const read = resolveViewports({ heights: [900] })

    expect(read).toMatchObject({ kind: 'refused', reason: 'no-width' })
  })

  it('should refuse an empty height list rather than choosing one', () => {
    const read = resolveViewports({ width: 1440, heights: [] })

    expect(read).toMatchObject({ kind: 'refused', reason: 'no-heights' })
    if (read.kind !== 'refused') return
    expect(read.detail).toContain('remaining scroll')
  })

  it('should refuse a height that is not a positive number', () => {
    const read = resolveViewports({ width: 1440, heights: [900, '1200'] })

    expect(read).toMatchObject({ kind: 'refused', reason: 'no-heights' })
  })

  it('should pair one width with every height the caller named', () => {
    const read = resolveViewports({ width: 1440, heights: [900, 1200, 1500] })

    expect(read).toMatchObject({ kind: 'resolved' })
    if (read.kind !== 'resolved') return
    expect(read.viewports).toEqual([
      { width: 1440, height: 900 },
      { width: 1440, height: 1200 },
      { width: 1440, height: 1500 },
    ])
  })
})

describe('describeViewport', () => {
  it('should read as the dimensions so two passes of one sweep separate', () => {
    expect(describeViewport({ width: 1440, height: 900 })).toBe('1440x900')
  })
})
