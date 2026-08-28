import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const SCRIPT = join(
  import.meta.dirname,
  '../scripts/core/check-ignore-parity.sh',
)

// The two paths the script's own SANCTIONED list names. Every fixture that
// expects a pass has to carry both, since a sanction naming a path that is not
// divergent is itself a failure.
const SANCTIONED = ['.claude/diagrams/', '.claude/README.md']

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
    writeGitignore('# Claude', ...SANCTIONED, '.claude/plans/')
    writeManifestEntries('.claude/plans/')

    expect(check().status).toBe(0)
  })

  it('should read a pattern and an entry that differ only in the trailing slash as one path', () => {
    writeGitignore('# Claude', ...SANCTIONED, '.claude/.tmp')
    writeManifestEntries('.claude/.tmp/')

    expect(check().status).toBe(0)
  })

  it('should fail on a claude path this repository ignores and the manifest omits', () => {
    writeGitignore('# Claude', ...SANCTIONED, '.claude/proposals/')
    writeManifestEntries('.claude/plans/')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain(
      '.claude/proposals is ignored here and absent from the manifest',
    )
  })

  it('should fail on an entry the manifest ships and this repository tracks', () => {
    writeGitignore('# Claude', ...SANCTIONED)
    writeManifestEntries('.claude/plans/')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain(
      '.claude/plans is shipped by the manifest and absent from .gitignore',
    )
  })

  it('should report each sanctioned divergence on the run that passes', () => {
    writeGitignore('# Claude', ...SANCTIONED, '.claude/plans/')
    writeManifestEntries('.claude/plans/')

    const result = check()
    expect(result.output).toContain(
      '.claude/diagrams stays out of the manifest',
    )
    expect(result.output).toContain(
      '.claude/README.md stays out of the manifest',
    )
  })

  it('should fail on a sanctioned path the manifest has since taken', () => {
    writeGitignore('# Claude', ...SANCTIONED)
    writeManifestEntries(...SANCTIONED)

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain(
      '.claude/diagrams is sanctioned as a divergence and is no longer one',
    )
  })

  it('should fail on a sanctioned path .gitignore has since dropped', () => {
    writeGitignore('# Claude', '.claude/diagrams/', '.claude/plans/')
    writeManifestEntries('.claude/plans/')

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain(
      '.claude/README.md is sanctioned as a divergence and is no longer one',
    )
  })

  it('should ignore a pattern outside .claude/, which the claude manifest says nothing about', () => {
    writeGitignore(
      'node_modules/',
      '.env',
      '# Claude',
      ...SANCTIONED,
      '.claude/plans/',
    )
    writeManifestEntries('.claude/plans/')

    expect(check().status).toBe(0)
  })

  it('should count a claude path filed under a header of its own as present', () => {
    writeGitignore(
      '# Claude',
      ...SANCTIONED,
      '',
      '# Teaching workspace',
      '.claude/teach/',
    )
    writeManifestEntries('.claude/teach/')

    expect(check().status).toBe(0)
  })

  it('should read the array when a formatter has wrapped it across lines', () => {
    writeGitignore('# Claude', ...SANCTIONED, '.claude/plans/')
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
    writeGitignore('# Claude', ...SANCTIONED)
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
    writeGitignore('# Claude', ...SANCTIONED)

    const result = check()
    expect(result.status).toBe(1)
    expect(result.output).toContain('ignore parity unverifiable')
  })
})
