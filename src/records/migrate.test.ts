import { describe, expect, it } from 'vitest'
import { migrateRecord } from '@/records/migrate'

function entry(fields: string, body = 'Some rule.'): string {
  return ['---', fields, '---', '', body, ''].join('\n')
}

describe('migrateRecord', () => {
  it('should add category derived from the filename prefix', () => {
    const text = entry(
      ['title: Name the wrong run', 'description: Omit a key'].join('\n'),
    )

    const outcome = migrateRecord(
      'category-from-name',
      'project-scope-glob.md',
      text,
    )

    expect(outcome).toEqual({
      ok: true,
      text: entry(
        [
          'title: Name the wrong run',
          'description: Omit a key',
          'category: Project',
        ].join('\n'),
      ),
    })
  })

  it('should preserve the body and every existing field untouched', () => {
    const fields = ['title: A rule', 'description: Its reason'].join('\n')
    const text = entry(fields, 'The body, word for word.')

    const outcome = migrateRecord('category-from-name', 'user-voice.md', text)

    expect(outcome.ok).toBe(true)
    expect(outcome.ok && outcome.text).toContain('The body, word for word.')
    expect(outcome.ok && outcome.text).toContain('category: User')
  })

  it('should refuse a record that already carries a category', () => {
    const text = entry(
      ['title: A rule', 'description: Its reason', 'category: Project'].join(
        '\n',
      ),
    )

    const outcome = migrateRecord(
      'category-from-name',
      'project-scope-glob.md',
      text,
    )

    expect(outcome).toMatchObject({
      ok: false,
      reason: 'field-unrecoverable',
      message: 'project-scope-glob.md already carries a category.',
    })
  })

  it('should refuse a name whose prefix names no memory type', () => {
    const text = entry(['title: A rule', 'description: Its reason'].join('\n'))

    const outcome = migrateRecord(
      'category-from-name',
      'verify-scope-glob.md',
      text,
    )

    expect(outcome.ok).toBe(false)
    expect(outcome.ok || outcome.message).toContain(
      'is not named <type>-<slug>.md',
    )
  })

  it('should refuse a record with no frontmatter block', () => {
    const outcome = migrateRecord(
      'category-from-name',
      'project-scope-glob.md',
      'No frontmatter here.\n',
    )

    expect(outcome.ok).toBe(false)
    expect(outcome.ok || outcome.message).toContain('carries no frontmatter')
  })
})
