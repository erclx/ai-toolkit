import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type CheckReport,
  countStates,
  hasDrift,
  installedStampDomains,
  parseNewSkills,
  parseUpstream,
} from '@/sync/check'
import type { ScanEntry } from '@/sync/engine'

let TARGET: string

function buildReport(
  entries: readonly ScanEntry[],
  overrides: Partial<CheckReport> = {},
): CheckReport {
  return {
    covers: ['standards'],
    domains: [
      {
        domain: 'standards',
        stamped: true,
        counts: countStates(entries),
        entries,
        historyUnavailable: false,
        upstream: [],
      },
    ],
    seeds: { entries: [], historyUnavailable: false },
    superseded: [],
    unmigrated: [],
    newSkills: [],
    ...overrides,
  }
}

beforeEach(() => {
  TARGET = mkdtempSync(join(tmpdir(), 'aitk-check-'))
})

afterEach(() => {
  rmSync(TARGET, { recursive: true, force: true })
})

describe('installedStampDomains', () => {
  it('should return nothing for a target with no installed domains', () => {
    expect(installedStampDomains(TARGET)).toEqual([])
  })

  it('should report only the domains present on disk', () => {
    mkdirSync(join(TARGET, '.claude/standards'), { recursive: true })
    mkdirSync(join(TARGET, '.claude/rules'), { recursive: true })

    expect(installedStampDomains(TARGET)).toEqual(['standards', 'governance'])
  })
})

describe('countStates', () => {
  it('should count each state separately', () => {
    const counts = countStates([
      { state: 'matching', rel: 'a.md' },
      { state: 'stale', rel: 'b.md' },
      { state: 'stale', rel: 'c.md' },
      { state: 'customized', rel: 'd.md' },
      { state: 'drifted', rel: 'e.md' },
      { state: 'orphaned', rel: 'f.md' },
      { state: 'stranded', rel: 'g.md' },
    ])

    expect(counts).toEqual({
      matching: 1,
      stale: 2,
      customized: 1,
      drifted: 1,
      orphaned: 1,
      stranded: 1,
    })
  })

  it('should return zeroes for an empty scan', () => {
    expect(countStates([])).toEqual({
      matching: 0,
      stale: 0,
      customized: 0,
      drifted: 0,
      orphaned: 0,
      stranded: 0,
    })
  })
})

describe('hasDrift', () => {
  it('should report no drift when every file matches', () => {
    expect(hasDrift(buildReport([{ state: 'matching', rel: 'a.md' }]))).toBe(
      false,
    )
  })

  it('should report drift for a stale file', () => {
    expect(hasDrift(buildReport([{ state: 'stale', rel: 'a.md' }]))).toBe(true)
  })

  it('should not report drift for a project-authored file', () => {
    expect(hasDrift(buildReport([{ state: 'orphaned', rel: 'a.md' }]))).toBe(
      false,
    )
  })

  it('should report drift for a stranded file', () => {
    expect(hasDrift(buildReport([{ state: 'stranded', rel: 'a.md' }]))).toBe(
      true,
    )
  })

  it('should report drift for a customized file', () => {
    expect(hasDrift(buildReport([{ state: 'customized', rel: 'a.md' }]))).toBe(
      true,
    )
  })

  it('should report drift for an unmigrated domain', () => {
    const report = buildReport([{ state: 'matching', rel: 'a.md' }], {
      unmigrated: [
        {
          domain: 'standards',
          rootPath: 'standards',
          installPath: join('.claude', 'standards'),
          files: 9,
        },
      ],
    })

    expect(hasDrift(report)).toBe(true)
  })

  it('should not report drift for a superseded artifact', () => {
    const report = buildReport([{ state: 'matching', rel: 'a.md' }], {
      superseded: [
        {
          rel: join('.claude', 'TASKS.md'),
          replacedBy: join('.claude', 'tasks'),
        },
      ],
    })

    expect(hasDrift(report)).toBe(false)
  })

  it('should not report drift for a seed the project edited', () => {
    const report = buildReport([{ state: 'matching', rel: 'a.md' }], {
      seeds: {
        entries: [{ state: 'drifted', rel: 'CLAUDE.md' }],
        historyUnavailable: false,
      },
    })

    expect(hasDrift(report)).toBe(false)
  })
})

describe('parseUpstream', () => {
  it('should split each line into a sha and a subject', () => {
    const log =
      '96bca86 feat(plans): archive shipped plans\n31bb7c2 refactor: move fixtures'

    expect(parseUpstream(log)).toEqual([
      { sha: '96bca86', subject: 'feat(plans): archive shipped plans' },
      { sha: '31bb7c2', subject: 'refactor: move fixtures' },
    ])
  })

  it('should return nothing for an empty log', () => {
    expect(parseUpstream('')).toEqual([])
  })

  it('should skip a line carrying no subject', () => {
    expect(parseUpstream('96bca86')).toEqual([])
  })
})

describe('parseNewSkills', () => {
  it('should name a skill from its added SKILL.md', () => {
    const paths =
      'claude/skills/git-ship/SKILL.md\nclaude/skills/git-ship/README.md'

    expect(parseNewSkills(paths)).toEqual(['git-ship'])
  })

  it('should ignore support files added to an existing skill', () => {
    expect(parseNewSkills('claude/skills/git-ship/reference.md')).toEqual([])
  })

  it('should sort and deduplicate skill names', () => {
    const paths = [
      'claude/skills/zebra/SKILL.md',
      'claude/skills/alpha/SKILL.md',
      'claude/skills/alpha/SKILL.md',
    ].join('\n')

    expect(parseNewSkills(paths)).toEqual(['alpha', 'zebra'])
  })

  it('should return nothing when no skills were added', () => {
    expect(parseNewSkills('')).toEqual([])
  })
})
