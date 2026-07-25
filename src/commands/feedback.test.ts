import { describe, expect, it } from 'vitest'
import { deriveSlug, deriveTitle } from '@/commands/feedback-format'

describe('deriveTitle', () => {
  it('builds a title from the Surface field', () => {
    const body =
      '## Toolkit feedback\n\n**Surface:** plugin skill, git-commit\n'
    expect(deriveTitle(body)).toBe('feedback: plugin skill, git-commit')
  })

  it('falls back to a generic title when no Surface field is present', () => {
    const body = '## Toolkit feedback\n\n**Observed:** it broke'
    expect(deriveTitle(body)).toBe('toolkit feedback')
  })

  it('truncates a long title to the max length', () => {
    const body = `**Surface:** ${'x'.repeat(200)}`
    expect(deriveTitle(body).length).toBeLessThanOrEqual(72)
  })
})

describe('deriveSlug', () => {
  it('builds a slug from the Surface field', () => {
    const body = '**Surface:** plugin skill, git-commit'
    expect(deriveSlug(body)).toBe('plugin-skill-git-commit')
  })

  it('falls back to general when no Surface field is present', () => {
    expect(deriveSlug('no surface here')).toBe('general')
  })
})
