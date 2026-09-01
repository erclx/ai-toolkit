import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const SCRIPT = join(
  import.meta.dirname,
  '../scripts/core/check-ignore-parity.sh',
)

let root: string

// PROJECT_ROOT is what the fixture points the script at, and a run under a hook
// that already exported one would resolve every case against the wrong tree.
const buildEnv = (): NodeJS.ProcessEnv => ({
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'PROJECT_ROOT'),
  ),
  PROJECT_ROOT: root,
})

function writeGitignore(...lines: string[]): void {
  writeFileSync(join(root, '.gitignore'), `${lines.join('\n')}\n`)
}

function writeManifest(body: string): void {
  const dir = join(root, 'tooling', 'claude')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'manifest.toml'), body)
}

function writeManifestEntries(...entries: string[]): void {
  const array = entries.map((entry) => `"${entry}"`).join(', ')
  writeManifest(
    `[stack]\nname = "claude"\n\n[gitignore]\n"# Claude" = [${array}]\n`,
  )
}

function check(): { status: number; output: string } {
  const result = spawnSync('bash', [SCRIPT], {
    cwd: root,
    encoding: 'utf8',
    env: buildEnv(),
  })
  return {
    status: result.status ?? -1,
    output: `${result.stdout}${result.stderr}`,
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ignore-parity-'))
})

afterEach(() => {
  rmSync(root, { force: true, recursive: true })
})

describe('check-ignore-parity', () => {
  it('should pass when both lists name the same claude paths', () => {
    writeGitignore('# Claude', '.claude/plans/')
    writeManifestEntries('.claude/plans/')

    expect(check().status).toBe(0)
  })

  it('should read a pattern and an entry that differ only in the trailing slash as one path', () => {
    writeGitignore('# Claude', '.claude/.tmp')
    writeManifestEntries('.claude/.tmp/')

    expect(check().status).toBe(0)
  })

  it('should fail on a claude path this repository ignores and the manifest omits', () => {
    writeGitignore('# Claude', '.claude/proposals/')
    writeManifestEntries('.claude/plans/')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain(
      '.claude/proposals is ignored here and absent from the manifest',
    )
  })

  it('should fail on an entry the manifest ships and this repository tracks', () => {
    // A non-claude pattern so the file parses as read rather than as empty,
    // which the script refuses ahead of any comparison.
    writeGitignore('node_modules/', '# Claude')
    writeManifestEntries('.claude/plans/')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain(
      '.claude/plans is shipped by the manifest and absent from .gitignore',
    )
  })

  it('should ignore a pattern outside .claude/, which the claude manifest says nothing about', () => {
    writeGitignore('node_modules/', '.env', '# Claude', '.claude/plans/')
    writeManifestEntries('.claude/plans/')

    expect(check().status).toBe(0)
  })

  it('should count a claude path filed under a header of its own as present', () => {
    writeGitignore('# Claude', '', '# Teaching workspace', '.claude/teach/')
    writeManifestEntries('.claude/teach/')

    expect(check().status).toBe(0)
  })

  it('should read the array when a formatter has wrapped it across lines', () => {
    writeGitignore('# Claude', '.claude/plans/')
    writeManifest(
      [
        '[stack]',
        'name = "claude"',
        '',
        '[gitignore]',
        '"# Claude" = [',
        '  ".claude/plans/",',
        ']',
        '',
      ].join('\n'),
    )

    expect(check().status).toBe(0)
  })

  it('should refuse a manifest whose gitignore table carries no claude array', () => {
    writeGitignore('# Claude')
    writeManifest('[stack]\nname = "claude"\n')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain('ignore parity unverifiable')
  })

  it('should refuse a tree with no .gitignore rather than report parity', () => {
    writeManifestEntries('.claude/plans/')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain('ignore parity unverifiable')
  })

  it('should refuse a tree with no claude manifest rather than report parity', () => {
    writeGitignore('# Claude')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain('ignore parity unverifiable')
  })
})
