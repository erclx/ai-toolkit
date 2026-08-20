import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildToolingReport,
  type CheckReport,
  countStates,
  hasDrift,
  installedStampDomains,
  isManagedTarget,
  parseNewSkills,
  parseUpstream,
  type ToolingReport,
} from '@/sync/check'
import type { ScanEntry } from '@/sync/engine'
import { emptyReverseReport } from '@/sync/reverse'
import { readStamp, type Stamp, stampPath } from '@/sync/stamp'

let TARGET: string

function buildReport(
  entries: readonly ScanEntry[],
  overrides: Partial<CheckReport> = {},
): CheckReport {
  return {
    covers: ['snippets'],
    managed: true,
    domains: [
      {
        domain: 'snippets',
        stamped: true,
        counts: countStates(entries),
        entries,
        historyUnavailable: false,
        upstream: [],
      },
    ],
    tooling: unmeasuredTooling(),
    seeds: { entries: [], historyUnavailable: false },
    superseded: [],
    unmigrated: [],
    newSkills: [],
    reverse: emptyReverseReport(),
    skew: {
      state: 'current',
      name: '@erclx/aitk',
      installed: '0.0.0',
      latest: '0.0.0',
    },
    ...overrides,
  }
}

function unmeasuredTooling(): ToolingReport {
  return {
    measured: false,
    chain: [],
    counts: {
      configs: 0,
      seeds: 0,
      scripts: 0,
      deps: 0,
      gitignore: 0,
      references: 0,
    },
    changes: 0,
  }
}

beforeEach(() => {
  TARGET = mkdtempSync(join(tmpdir(), 'aitk-check-'))
})

afterEach(() => {
  rmSync(TARGET, { recursive: true, force: true })
})

describe('buildToolingReport', () => {
  let TOOLKIT: string

  /** A stack carrying one config, which is the smallest thing `scan` can compare. */
  function writeStack(name: string, extend?: string): void {
    const dir = join(TOOLKIT, 'tooling', name)
    mkdirSync(join(dir, 'configs'), { recursive: true })
    writeFileSync(
      join(dir, 'manifest.toml'),
      extend === undefined ? '[stack]\n' : `[stack]\nextends = "${extend}"\n`,
    )
    writeFileSync(join(dir, 'configs', `${name}.config.json`), `${name}\n`)
  }

  function stampChain(chain: readonly string[]): Stamp | undefined {
    mkdirSync(join(TARGET, '.claude'), { recursive: true })
    writeFileSync(
      stampPath(TARGET),
      JSON.stringify({
        covers: ['tooling'],
        domains: {
          tooling: { commit: 'abc1234', syncedAt: 'then', files: {}, chain },
        },
      }),
    )
    return readStamp(TARGET)
  }

  beforeEach(() => {
    TOOLKIT = mkdtempSync(join(tmpdir(), 'aitk-check-toolkit-'))
  })

  afterEach(() => {
    rmSync(TOOLKIT, { recursive: true, force: true })
  })

  it('should report unmeasured when no stamp exists', () => {
    const report = buildToolingReport(TOOLKIT, TARGET, undefined)

    expect(report.measured).toBe(false)
    expect(report.chain).toEqual([])
  })

  it('should report unmeasured when the stamp covers other domains only', () => {
    mkdirSync(join(TARGET, '.claude'), { recursive: true })
    writeFileSync(
      stampPath(TARGET),
      JSON.stringify({
        covers: ['snippets'],
        domains: { snippets: { syncedAt: 'then', files: {} } },
      }),
    )

    expect(
      buildToolingReport(TOOLKIT, TARGET, readStamp(TARGET)).measured,
    ).toBe(false)
  })

  it('should report unmeasured when the toolkit no longer ships the chain', () => {
    const stamp = stampChain(['retired-stack'])

    expect(buildToolingReport(TOOLKIT, TARGET, stamp).measured).toBe(false)
  })

  /**
   * The render reads the chain to decide which of the two unmeasured causes to
   * name. Dropping it here would report a recorded chain as none recorded.
   */
  it('should keep the recorded chain when the toolkit no longer ships it', () => {
    const stamp = stampChain(['retired-stack'])

    expect(buildToolingReport(TOOLKIT, TARGET, stamp).chain).toEqual([
      'retired-stack',
    ])
  })

  it('should report measured with no changes when the target matches', () => {
    writeStack('base')
    writeFileSync(join(TARGET, 'base.config.json'), 'base\n')

    const report = buildToolingReport(TOOLKIT, TARGET, stampChain(['base']))

    expect(report.measured).toBe(true)
    expect(report.changes).toBe(0)
    expect(report.counts.configs).toBe(0)
  })

  it('should count a config the target is missing', () => {
    writeStack('base')

    const report = buildToolingReport(TOOLKIT, TARGET, stampChain(['base']))

    expect(report.measured).toBe(true)
    expect(report.counts.configs).toBe(1)
    expect(report.changes).toBe(1)
  })

  it('should carry the anchor the install recorded', () => {
    writeStack('base')

    const report = buildToolingReport(TOOLKIT, TARGET, stampChain(['base']))

    expect(report.commit).toBe('abc1234')
    expect(report.syncedAt).toBe('then')
  })

  /**
   * The recorded chain is the truth of what was installed. Re-resolving from
   * the leaf would pull `base` back in and report its config as missing, which
   * is drift against a layer the run deliberately skipped.
   */
  it('should scan only the recorded stacks, not the leaf extends chain', () => {
    writeStack('base')
    writeStack('vite-react', 'base')
    writeFileSync(join(TARGET, 'vite-react.config.json'), 'vite-react\n')

    const report = buildToolingReport(
      TOOLKIT,
      TARGET,
      stampChain(['vite-react']),
    )

    expect(report.chain).toEqual(['vite-react'])
    expect(report.counts.configs).toBe(0)
  })
})

describe('installedStampDomains', () => {
  it('should return nothing for a target with no installed domains', () => {
    expect(installedStampDomains(TARGET)).toEqual([])
  })

  it('should report only the domains present on disk', () => {
    mkdirSync(join(TARGET, '.claude/snippets'), { recursive: true })
    mkdirSync(join(TARGET, '.claude/rules'), { recursive: true })

    expect(installedStampDomains(TARGET)).toEqual(['snippets', 'governance'])
  })
})

describe('isManagedTarget', () => {
  const rootLayout = [
    {
      domain: 'snippets' as const,
      rootPath: 'snippets',
      installPath: join('.claude', 'snippets'),
      files: 9,
    },
  ]

  it('should report an empty directory as unmanaged', () => {
    expect(isManagedTarget(TARGET, [])).toBe(false)
  })

  it('should report a target carrying .claude as managed', () => {
    mkdirSync(join(TARGET, '.claude'), { recursive: true })

    expect(isManagedTarget(TARGET, [])).toBe(true)
  })

  it('should report a target carrying only CLAUDE.md as managed', () => {
    writeFileSync(join(TARGET, 'CLAUDE.md'), '# Project\n')

    expect(isManagedTarget(TARGET, [])).toBe(true)
  })

  it('should not read a nested .claude as the target being managed', () => {
    mkdirSync(join(TARGET, 'packages', 'web', '.claude'), { recursive: true })

    expect(isManagedTarget(TARGET, [])).toBe(false)
  })

  it('should report a root-layout target with no marker as managed', () => {
    expect(isManagedTarget(TARGET, rootLayout)).toBe(true)
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

  it('should not report drift for a binary behind the published version', () => {
    const report = buildReport([{ state: 'matching', rel: 'a.md' }], {
      skew: {
        state: 'behind',
        name: '@erclx/aitk',
        installed: '0.109.0',
        latest: '0.110.0',
      },
    })

    expect(hasDrift(report)).toBe(false)
  })

  it('should not report drift when the registry could not be reached', () => {
    const report = buildReport([{ state: 'matching', rel: 'a.md' }], {
      skew: {
        state: 'unknown',
        name: '@erclx/aitk',
        installed: '0.110.0',
        reason: 'Registry lookup failed: offline',
      },
    })

    expect(hasDrift(report)).toBe(false)
  })

  it('should report drift for an unmigrated domain', () => {
    const report = buildReport([{ state: 'matching', rel: 'a.md' }], {
      unmigrated: [
        {
          domain: 'snippets',
          rootPath: 'snippets',
          installPath: join('.claude', 'snippets'),
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
