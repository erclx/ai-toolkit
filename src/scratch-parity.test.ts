import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const HOOK = join(import.meta.dirname, '../.claude/hooks/scratch-guard.sh')
const ROOT = join(import.meta.dirname, '..')

// The hook accepts a scratch write it recognizes through one case arm under
// `case "$file_path" in`, the only one exiting 0 on more than the bare
// wildcard. Parsing it here rather than restating the two spellings is what
// makes this a parity test rather than a second copy of the pair.
function deriveAcceptPatterns(source: string): string[] {
  for (const line of source.split('\n')) {
    const match = line.trim().match(/^(.+)\)\s*exit 0\s*;;$/)
    if (!match || match[1] === '*') continue
    return match[1].split('|').map((pattern) => pattern.trim())
  }
  throw new Error(
    `No accept-pattern case arm found in ${HOOK}. The hook's shape changed; update this test's parser.`,
  )
}

// `*/.claude/.tmp/*` matches any path carrying that segment, the glob wrapper
// included. check-ignore reasons about a path rather than a bash case
// pattern, so the probe strips the wrapper down to the folder git has to
// ignore.
function probePath(pattern: string): string {
  const folder = pattern.replace(/^\*\//, '').replace(/\/\*$/, '')
  return `${folder}/probe.md`
}

function isIgnored(path: string): boolean {
  const result = spawnSync('git', ['check-ignore', '--quiet', path], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (result.status === 0) return true
  if (result.status === 1) return false
  throw new Error(
    `git check-ignore exited ${result.status ?? -1} on ${path}: ${result.stderr}`,
  )
}

describe('scratch-guard ignore parity', () => {
  const patterns = deriveAcceptPatterns(readFileSync(HOOK, 'utf8'))

  it('derives at least one accept pattern from the hook', () => {
    expect(patterns.length).toBeGreaterThan(0)
  })

  it.each(patterns)(
    'git ignores a write the hook accepts under %s',
    (pattern) => {
      expect(isIgnored(probePath(pattern))).toBe(true)
    },
  )
})
