import { describe, expect, it } from 'vitest'
import { groupByTreatment, SAMPLE_LIMIT } from '@/inventory/group'

const reading = (route: string, selector: string, treatment: string) => ({
  route,
  selector,
  treatment,
})

describe('groupByTreatment', () => {
  it('should collapse elements sharing one answer into a single row', () => {
    const groups = groupByTreatment([
      reading('/', 'button', 'ring'),
      reading('/', 'a.nav', 'ring'),
      reading('/pricing', 'button.buy', 'ring'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ treatment: 'ring', count: 3 })
  })

  it('should report one row per distinct answer rather than one per element', () => {
    const groups = groupByTreatment([
      reading('/', 'button', 'ring'),
      reading('/', 'a.nav', 'none'),
      reading('/pricing', 'input', 'ring'),
    ])

    expect(groups.map((group) => group.treatment)).toEqual(['ring', 'none'])
  })

  it('should order the heaviest answer first', () => {
    const groups = groupByTreatment([
      reading('/', 'a', 'none'),
      reading('/', 'button', 'ring'),
      reading('/', 'input', 'ring'),
    ])

    expect(groups.map((group) => group.count)).toEqual([2, 1])
  })

  it('should break a tie on the treatment so two runs report one order', () => {
    const groups = groupByTreatment([
      reading('/', 'button', 'shadow'),
      reading('/', 'a', 'none'),
    ])

    expect(groups.map((group) => group.treatment)).toEqual(['none', 'shadow'])
  })

  it('should name each route an answer appears on, once and in walk order', () => {
    const groups = groupByTreatment([
      reading('/pricing', 'button', 'ring'),
      reading('/', 'a', 'ring'),
      reading('/pricing', 'input', 'ring'),
    ])

    expect(groups[0]?.routes).toEqual(['/pricing', '/'])
  })

  it('should keep a bounded sample of the elements behind a row', () => {
    const groups = groupByTreatment(
      Array.from({ length: SAMPLE_LIMIT + 2 }, (_unused, index) =>
        reading('/', `button.b${index}`, 'ring'),
      ),
    )

    expect(groups[0]?.count).toBe(SAMPLE_LIMIT + 2)
    expect(groups[0]?.samples).toEqual(['button.b0', 'button.b1', 'button.b2'])
  })

  it('should report no rows for a walk that read no element', () => {
    expect(groupByTreatment([])).toEqual([])
  })
})
