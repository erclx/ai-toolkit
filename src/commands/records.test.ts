import { describe, expect, it } from 'vitest'
import { migrateExitCode, type Refusal, type Repair } from '@/commands/records'

function repair(record: string): Repair {
  return { record, remedy: 'category-from-name', path: record, text: '' }
}

function refusal(record: string): Refusal {
  return { record, message: 'refused' }
}

describe('migrateExitCode', () => {
  it('should return 0 when no finding carries a known transform', () => {
    expect(migrateExitCode([], [], false)).toBe(0)
    expect(migrateExitCode([], [], true)).toBe(0)
  })

  it('should return 1 when every candidate refused on a dry run', () => {
    expect(migrateExitCode([], [refusal('a.md')], false)).toBe(1)
  })

  it('should return 1 when every candidate refused under --write', () => {
    expect(migrateExitCode([], [refusal('a.md')], true)).toBe(1)
  })

  it('should return 2 when a record repaired and --write was not passed', () => {
    expect(migrateExitCode([repair('a.md')], [], false)).toBe(2)
  })

  it('should return 0 when --write applied every repair', () => {
    expect(migrateExitCode([repair('a.md')], [], true)).toBe(0)
  })

  it('should return 1 when --write applied some repairs and refused others', () => {
    expect(migrateExitCode([repair('a.md')], [refusal('b.md')], true)).toBe(1)
  })
})
