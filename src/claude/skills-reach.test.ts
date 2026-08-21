import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  citationsIn,
  isQualified,
  isToolkitOwned,
  readReceivedPaths,
  scanReach,
} from '@/claude/skills-reach'

let root: string

function write(rel: string, text: string): void {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'aitk-skills-reach-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('isQualified', () => {
  it('should accept a line naming the toolkit as the owner', () => {
    expect(
      isQualified('Read `.claude/context/indexes.md` from the toolkit.'),
    ).toBe(true)
  })

  it('should accept the possessive spelling the shipped bodies use', () => {
    expect(isQualified("Full semantics live in the toolkit's entry.")).toBe(
      true,
    )
  })

  it('should reject a bare citation with no owner named', () => {
    expect(
      isQualified('See `.claude/context/transcripts.md` for the fields.'),
    ).toBe(false)
  })
})

describe('isToolkitOwned', () => {
  it('should own a path under an authoring root no install channel delivers', () => {
    expect(isToolkitOwned('standards/intake.md', new Set())).toBe(true)
  })

  it('should disown a path a seed installs into the target', () => {
    expect(
      isToolkitOwned(
        '.claude/context/ci.md',
        new Set(['.claude/context/ci.md']),
      ),
    ).toBe(false)
  })

  it('should disown the split-folder spelling of a seeded entry', () => {
    expect(
      isToolkitOwned(
        '.claude/context/development/overview.md',
        new Set(['.claude/context/development.md']),
      ),
    ).toBe(false)
  })

  it('should disown a path outside every authoring root', () => {
    expect(isToolkitOwned('src/ui.ts', new Set())).toBe(false)
  })
})

describe('readReceivedPaths', () => {
  it('should read every seed payload as the path it lands on in a target', () => {
    write('tooling/base/seeds/.claude/context/ci.md', '# CI\n')
    write('tooling/claude/seeds/CLAUDE.md', '# Root\n')

    expect(readReceivedPaths(root)).toEqual(
      new Set(['.claude/context/ci.md', 'CLAUDE.md']),
    )
  })

  it('should return an empty set when the tooling tree carries no seeds', () => {
    expect(readReceivedPaths(root)).toEqual(new Set())
  })
})

describe('citationsIn', () => {
  it('should report a backticked toolkit path with its one-based line', () => {
    const text = [
      '# Body',
      '',
      'See `standards/intake.md` for the shape.',
    ].join('\n')

    expect(citationsIn('claude/skills/x/SKILL.md', text, new Set())).toEqual([
      {
        file: 'claude/skills/x/SKILL.md',
        line: 3,
        path: 'standards/intake.md',
        qualified: false,
      },
    ])
  })

  it('should mark a citation the sentence qualifies', () => {
    const text = "Read the toolkit's `standards/intake.md`."

    expect(citationsIn('claude/skills/x/SKILL.md', text, new Set())).toEqual([
      {
        file: 'claude/skills/x/SKILL.md',
        line: 1,
        path: 'standards/intake.md',
        qualified: true,
      },
    ])
  })

  it('should skip a placeholder path no reader can open', () => {
    const text = 'Propose `.claude/context/<domain>.md` for the entry.'

    expect(citationsIn('claude/skills/x/SKILL.md', text, new Set())).toEqual([])
  })

  it('should skip a path resolved through the plugin root', () => {
    const text = 'Read `${CLAUDE_SKILL_DIR}/../../standards/markdown.md`.'

    expect(citationsIn('claude/skills/x/SKILL.md', text, new Set())).toEqual([])
  })

  it('should skip prose that is not a path at all', () => {
    const text = 'Run `aitk claude skills audit` and read `--json`.'

    expect(citationsIn('claude/skills/x/SKILL.md', text, new Set())).toEqual([])
  })
})

describe('scanReach', () => {
  it('should split the shipped corpus into qualified and unqualified citations', () => {
    write('standards/intake.md', '# Intake\n')
    write('tooling/base/seeds/.claude/context/ci.md', '# CI\n')
    write(
      'claude/skills/alpha/SKILL.md',
      'See `standards/intake.md` for the shape.\n',
    )
    write(
      'claude/skills/beta/SKILL.md',
      "Read the toolkit's `standards/intake.md`.\n",
    )

    const report = scanReach(root)
    if (report.kind !== 'measured') throw new Error('expected a measurement')

    expect(report.bodies).toBe(2)
    expect(report.unqualified).toEqual([
      {
        file: 'claude/skills/alpha/SKILL.md',
        line: 1,
        path: 'standards/intake.md',
        qualified: false,
      },
    ])
    expect(report.qualified).toHaveLength(1)
  })

  it('should skip a citation of a path this repository does not hold', () => {
    write(
      'claude/skills/alpha/SKILL.md',
      'See `standards/never-written.md` for the shape.\n',
    )

    const report = scanReach(root)
    if (report.kind !== 'measured') throw new Error('expected a measurement')

    expect(report.unqualified).toEqual([])
  })

  it('should refuse when the shipped skill corpus is not on disk', () => {
    expect(scanReach(root)).toEqual({ kind: 'refused', reason: 'no-skills' })
  })
})
