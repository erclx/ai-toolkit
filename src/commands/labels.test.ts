import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execa } from 'execa'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const REPO_ROOT = join(import.meta.dirname, '..', '..')
const CLI = join(REPO_ROOT, 'src', 'cli.ts')
const RUN_TIMEOUT_MS = 30_000

/**
 * Spawns the CLI rather than importing the action, because the refusal
 * reports through `process.exitCode` and an in-process call would set it on
 * the test runner.
 */
async function runScan(
  args: string[],
): Promise<{ readonly titleFormatIssues: string[] }> {
  const result = await execa(
    process.execPath,
    [CLI, 'labels', 'scan', '--json', ...args],
    {
      reject: false,
      timeout: RUN_TIMEOUT_MS,
    },
  )
  const record = JSON.parse(result.stdout) as {
    titleFormatIssues: string[]
  }
  return { titleFormatIssues: record.titleFormatIssues }
}

describe('canon labels scan title format gate', () => {
  let cwdDir: string

  beforeEach(async () => {
    cwdDir = await mkdtemp(join(tmpdir(), 'canon-labels-scan-'))
  })

  afterEach(async () => {
    await rm(cwdDir, { recursive: true, force: true })
  })

  it('should skip the title format grade when --body-file carries no title', async () => {
    const bodyFile = join(cwdDir, 'reply.md')
    await writeFile(bodyFile, 'Looks good, one nit below.\n')

    const { titleFormatIssues } = await runScan(['--body-file', bodyFile])

    expect(titleFormatIssues).toEqual([])
  })

  it('should still grade a supplied title against the format rules', async () => {
    const { titleFormatIssues } = await runScan([
      '--title',
      'not a conventional title',
    ])

    expect(titleFormatIssues).toEqual(['structure'])
  })
})
