import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execa } from 'execa'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const CLI = join(import.meta.dirname, '..', 'cli.ts')
const RUN_TIMEOUT_MS = 30_000

const RECOVERABLE = [
  '---',
  'title: A rule',
  'description: Its reason',
  '---',
  '',
  'Body.',
  '',
].join('\n')

let root: string
let memoryDir: string

function migrate(args: string[]) {
  return execa(process.execPath, [CLI, 'records', 'migrate', ...args], {
    cwd: root,
    reject: false,
    timeout: RUN_TIMEOUT_MS,
  })
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'canon-records-migrate-'))
  memoryDir = join(root, '.claude', 'memory')
  mkdirSync(memoryDir, { recursive: true })
})

afterEach(() => {
  rmSync(root, { force: true, recursive: true })
})

describe('records migrate write batch', () => {
  it('should write a record even when another record in the same batch fails to write', async () => {
    writeFileSync(join(memoryDir, 'project-writable.md'), RECOVERABLE)
    writeFileSync(join(memoryDir, 'project-locked.md'), RECOVERABLE)
    chmodSync(join(memoryDir, 'project-locked.md'), 0o444)

    const result = await migrate([
      'memory',
      '--write',
      '--root',
      root,
      '--json',
    ])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).not.toMatch(/unhandled/i)

    const record = JSON.parse(result.stdout)
    expect(record.migrated).toEqual(['project-writable.md'])
    expect(record.refused).toHaveLength(1)
    expect(record.refused[0].record).toBe('project-locked.md')
    expect(record.refused[0].message).toContain('could not be written')

    expect(
      readFileSync(join(memoryDir, 'project-writable.md'), 'utf8'),
    ).toContain('category: Project')
    expect(readFileSync(join(memoryDir, 'project-locked.md'), 'utf8')).toBe(
      RECOVERABLE,
    )
  })
})
