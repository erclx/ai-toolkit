import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const REPO_ROOT = join(import.meta.dirname, '..')
const VERIFY_SCRIPT = join(REPO_ROOT, 'scripts/tooling/verify.sh')

let fixture: string
let bin: string

// A full fixture project root rather than an override of one or two paths,
// because `verify.sh` sources `scripts/lib/ui.sh` and `scripts/lib/tooling.sh`
// from `$PROJECT_ROOT` before it reads a manifest or writes to `.canon/tmp/`.
// Copying the real libs keeps the run behaving like a real invocation while
// isolating the manifest, the scaffold, and the tmp tree from this checkout.
const stubBin = (name: string, body: string): void => {
  writeFileSync(join(bin, name), `#!/usr/bin/env bash\n${body}\n`, {
    mode: 0o755,
  })
}

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'verify-sync-'))
  bin = join(fixture, 'bin')
  mkdirSync(bin, { recursive: true })
  cpSync(join(REPO_ROOT, 'scripts/lib'), join(fixture, 'scripts/lib'), {
    recursive: true,
  })
  mkdirSync(join(fixture, 'tooling/stub-stack'), { recursive: true })
  writeFileSync(
    join(fixture, 'tooling/stub-stack/manifest.toml'),
    '[stack]\nscaffold = "mkdir -p {{name}} && touch {{name}}/.keep"\n',
  )
})

afterEach(() => {
  rmSync(fixture, { force: true, recursive: true })
})

describe('verify.sh Sync phase', () => {
  it('should resolve the checkout cli.ts through bun rather than PATH canon', () => {
    stubBin('canon', `touch "${join(fixture, 'canon-invoked')}"\nexit 1`)
    stubBin('bun', `echo "$@" >> "${join(fixture, 'bun-args')}"\nexit 0`)

    const run = spawnSync('bash', [VERIFY_SCRIPT, 'stub-stack'], {
      cwd: fixture,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        PROJECT_ROOT: fixture,
        GIT_AUTHOR_NAME: 'verify-sync-test',
        GIT_AUTHOR_EMAIL: 'verify-sync-test@example.com',
        GIT_COMMITTER_NAME: 'verify-sync-test',
        GIT_COMMITTER_EMAIL: 'verify-sync-test@example.com',
      },
    })

    expect(run.status).toBe(0)
    expect(existsSync(join(fixture, 'canon-invoked'))).toBe(false)
    expect(readFileSync(join(fixture, 'bun-args'), 'utf8')).toContain(
      `${fixture}/src/cli.ts tooling sync stub-stack . --write`,
    )
    expect(run.stderr).toContain(`bun ${fixture}/src/cli.ts`)
  })
})
