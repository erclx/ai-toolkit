import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runCli } from '@/process/harness'

let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'aitk-harness-'))
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('runCli', () => {
  it('should exit 0 for a verb that is registered', () => {
    const run = runCli(['snippets', 'list', '--json'], { cwd })

    expect(run.status).toBe(0)
  })

  it('should parse the --json record off stdout for a registered verb', () => {
    const run = runCli(['snippets', 'list', '--json'], { cwd })

    expect(run.json).toMatchObject({ categories: expect.any(Array) })
  })

  it('should exit non-zero for a subcommand nothing registers', () => {
    const run = runCli(['gov', 'not-a-real-subcommand'], { cwd })

    expect(run.status).not.toBe(0)
  })

  it('should name the unknown command on stderr rather than passing quietly', () => {
    const run = runCli(['gov', 'not-a-real-subcommand'], { cwd })

    expect(run.stderr).toContain('not-a-real-subcommand')
  })

  it('should leave json undefined when the command wrote none', () => {
    const run = runCli(['gov', 'not-a-real-subcommand'], { cwd })

    expect(run.json).toBeUndefined()
  })
})
