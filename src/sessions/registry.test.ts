import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readRegistry } from '@/sessions/registry'

let DIR: string

beforeEach(() => {
  DIR = mkdtempSync(join(tmpdir(), 'canon-sessions-'))
})

afterEach(() => {
  rmSync(DIR, { recursive: true, force: true })
})

function seed(pid: number, fields: Record<string, unknown> = {}): void {
  writeFileSync(
    join(DIR, `${pid}.json`),
    JSON.stringify({
      pid,
      sessionId: `id-${pid}`,
      cwd: `/repo/worktrees/w${pid}`,
      name: `canon-${pid}`,
      kind: 'interactive',
      status: 'idle',
      startedAt: pid,
      procStart: String(pid * 10),
      ...fields,
    }),
  )
}

describe('readRegistry', () => {
  it('should report an absent folder as absent rather than as empty', () => {
    const registry = readRegistry(join(DIR, 'nowhere'))

    expect(registry.kind).toBe('absent')
  })

  it('should report a present folder holding no record as read', () => {
    const registry = readRegistry(DIR)

    expect(registry).toMatchObject({ kind: 'read', records: [] })
  })

  it('should read the working directory each session wrote for itself', () => {
    seed(100)

    const registry = readRegistry(DIR)

    expect(registry.kind === 'read' && registry.records[0]?.cwd).toBe(
      '/repo/worktrees/w100',
    )
  })

  it('should order the records newest first', () => {
    seed(100)
    seed(300)
    seed(200)

    const registry = readRegistry(DIR)
    const started =
      registry.kind === 'read'
        ? registry.records.map((record) => record.startedAt)
        : []

    expect(started).toEqual([300, 200, 100])
  })

  it('should drop a record that does not parse', () => {
    seed(100)
    writeFileSync(join(DIR, '999.json'), '{ not json')

    const registry = readRegistry(DIR)

    expect(registry.kind === 'read' && registry.records).toHaveLength(1)
  })

  it('should drop a record carrying no working directory', () => {
    seed(100, { cwd: '' })

    const registry = readRegistry(DIR)

    expect(registry.kind === 'read' && registry.records).toHaveLength(0)
  })

  it('should drop a record carrying a pid that addresses a process group', () => {
    seed(100, { pid: 0 })

    const registry = readRegistry(DIR)

    expect(registry.kind === 'read' && registry.records).toHaveLength(0)
  })

  it('should ignore a sibling file that is not a record', () => {
    seed(100)
    writeFileSync(join(DIR, '100.abc.key'), 'secret')

    const registry = readRegistry(DIR)

    expect(registry.kind === 'read' && registry.records).toHaveLength(1)
  })
})
