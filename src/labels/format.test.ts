import { describe, expect, it } from 'vitest'
import { checkTitleFormat } from '@/labels/format'

describe('checkTitleFormat', () => {
  it('should report clean for a conforming title', () => {
    const result = checkTitleFormat(
      'feat(labels): add a title-format check to canon labels scan',
    )

    expect(result).toEqual({ conforms: true, issues: [] })
  })

  it('should report structure alone for a title carrying no type(scope): shape', () => {
    // The title that actually reached #1523 before it was renamed, breaking
    // every rule at once with no `<type>(<scope>): ` prefix to grade casing
    // or length against.
    const result = checkTitleFormat(
      'One derivation for the branch a dispatch checks and a worker takes',
    )

    expect(result).toEqual({ conforms: false, issues: ['structure'] })
  })

  it('should report casing-type alone for an uppercase type', () => {
    const result = checkTitleFormat('Feat(labels): add a check')

    expect(result).toEqual({ conforms: false, issues: ['casing-type'] })
  })

  it('should report casing-scope alone for an uppercase scope', () => {
    const result = checkTitleFormat('feat(Labels): add a check')

    expect(result).toEqual({ conforms: false, issues: ['casing-scope'] })
  })

  it('should report casing-subject alone for an uppercase first subject word', () => {
    const result = checkTitleFormat('feat(labels): Add a check')

    expect(result).toEqual({ conforms: false, issues: ['casing-subject'] })
  })

  it('should report length alone for a title over 72 characters', () => {
    const result = checkTitleFormat(
      'feat(labels): add a title-format check that pushes this well past the cap',
    )

    expect(result.issues).toEqual(['length'])
    expect(result.conforms).toBe(false)
  })

  it('should report every casing rule together when all three break', () => {
    const result = checkTitleFormat('Feat(Labels): Add a check')

    expect(result).toEqual({
      conforms: false,
      issues: ['casing-type', 'casing-scope', 'casing-subject'],
    })
  })
})
