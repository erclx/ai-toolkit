import { execaSync, execa } from 'execa'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const REPO_ROOT = join(import.meta.dirname, '..', '..')
const CLI = join(REPO_ROOT, 'src', 'cli.ts')
const RUN_TIMEOUT_MS = 30_000

const WITH_CRITERION = `---
title: Fixture reference
description: A fixture standard
---

# Fixture reference

## Scope

Governs nothing real.

## Success criterion

- Answers a question a reviewer can check.
`

const WITH_TEMPLATE_CRITERION = `---
title: Fixture reference
description: A fixture standard
---

# Fixture reference

## Scope

Governs nothing real.

## What a working fixture looks like

- Answers a question a reviewer can check.
`

function write(root: string, path: string, text: string): void {
  const full = join(root, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, text)
}

/**
 * Runs git against the fixture with the ambient environment dropped.
 *
 * A git hook exports `GIT_DIR` into the processes it runs and that variable
 * takes precedence over `-C`, so a bare call would read whichever repository
 * invoked the suite rather than the fixture's own history.
 */
function git(root: string, args: string[]): string {
  return execaSync('git', ['-C', root, ...args], {
    extendEnv: false,
    env: {},
  }).stdout.trimEnd()
}

async function runAudit(root: string): Promise<{
  exitCode: number
  stdout: string
}> {
  const result = await execa(process.execPath, [CLI, 'standards', 'audit'], {
    cwd: root,
    reject: false,
    timeout: RUN_TIMEOUT_MS,
  })
  return { exitCode: result.exitCode ?? 1, stdout: result.stdout }
}

describe('canon standards audit', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'canon-standards-cli-'))
    git(root, ['init', '--initial-branch=main'])
    git(root, ['config', 'user.email', 'test@example.com'])
    git(root, ['config', 'user.name', 'Test'])
    write(root, '.gitkeep', '')
    git(root, ['add', '-A'])
    git(root, ['commit', '-m', 'first'])
    git(root, ['checkout', '-b', 'feat/x'])
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('should exit 0 and never claim one fixed heading for a literal-heading arrival', async () => {
    write(root, 'standards/new.md', WITH_CRITERION)

    const result = await runAudit(root)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).not.toContain('## Success criterion')
  })

  it('should exit 0 and never claim one fixed heading for a templated-heading arrival', async () => {
    write(root, 'standards/new.md', WITH_TEMPLATE_CRITERION)

    const result = await runAudit(root)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).not.toContain('## Success criterion')
  })
})
