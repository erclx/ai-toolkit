import { execaSync } from 'execa'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { gitEnv } from '@/git-env'
import { readSuperseded, type SupersededReport } from '@/gov/superseded'

let ROOT: string

function git(...args: string[]): string {
  return execaSync('git', ['-C', ROOT, ...args], {
    env: gitEnv(),
    extendEnv: false,
  }).stdout
}

function write(path: string, body: string): void {
  const full = join(ROOT, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, `${body}\n`)
}

function measured(
  report: SupersededReport,
): Extract<SupersededReport, { kind: 'measured' }> {
  if (report.kind !== 'measured') {
    throw new Error(`Expected a measured report, got: ${report.reason}`)
  }
  return report
}

function at(records: readonly { file: string; line: number }[]): string[] {
  return records.map((record) => `${record.file}:${record.line}`)
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-gov-superseded-'))
  git('init', '--initial-branch=main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('readSuperseded', () => {
  it('should name every declaration asserting the superseded value', async () => {
    write('fixtures/one.sh', 'echo feature-feat-add-farewell.md')
    write('fixtures/two.sh', 'assert feature-add-farewell.md')
    write('docs/guide.md', 'The plan lands at feature-add-farewell.md.')
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-',
      }),
    )

    expect(at(report.findings)).toEqual(['fixtures/one.sh:1'])
  })

  it('should reach an untracked file git does not ignore', async () => {
    write('fixtures/new.sh', 'echo feature-feat-add-farewell.md')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-',
      }),
    )

    expect(at(report.findings)).toEqual(['fixtures/new.sh:1'])
  })

  it('should stay quiet on a declaration that disagrees for a stated reason', async () => {
    write(
      'fixtures/legacy.sh',
      [
        '# aitk-allow-superseded: this arm pins the pre-transform spelling',
        'echo feature-feat-add-farewell.md',
      ].join('\n'),
    )
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-',
      }),
    )

    expect(report.findings).toEqual([])
    expect(at(report.exempt)).toEqual(['fixtures/legacy.sh:2'])
  })

  it('should report a bare marker naming no reason as a finding', async () => {
    write(
      'fixtures/bare.sh',
      ['# aitk-allow-superseded:', 'echo feature-feat-add-farewell.md'].join(
        '\n',
      ),
    )
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-',
      }),
    )

    expect(at(report.findings)).toEqual(['fixtures/bare.sh:2'])
    expect(report.exempt).toEqual([])
  })

  it('should report every occurrence on one line under its own column', async () => {
    write('fixtures/pair.sh', 'cp feature-feat-a.md feature-feat-b.md')
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-',
      }),
    )

    expect(report.findings.map((finding) => finding.column)).toEqual([4, 22])
  })

  it('should not mark a finding whose only replacement text sits inside the superseded value', async () => {
    write('fixtures/one.sh', 'echo feature-feat-add-farewell.md')
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-',
      }),
    )

    expect(report.findings).toHaveLength(1)
    expect(report.findings[0].carriesReplacement).toBe(false)
  })

  it('should cut a preview past the limit rather than printing the whole line', async () => {
    write('fixtures/long.sh', `echo feature-feat-a.md # ${'x'.repeat(400)}`)
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-',
      }),
    )

    expect(report.findings[0].preview).toHaveLength(201)
    expect(report.findings[0].preview.endsWith('…')).toBe(true)
  })

  it('should mark no finding as carrying an empty replacement', async () => {
    write('fixtures/one.sh', 'echo feature-feat-add-farewell.md')
    write('fixtures/two.sh', 'echo plain text with no value')
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: '',
      }),
    )

    expect(report.findings).toHaveLength(1)
    expect(report.findings[0].carriesReplacement).toBe(false)
  })

  it('should mark a finding whose line already carries the replacement', async () => {
    write(
      'standards/slug.md',
      'The branch yields feature-add-farewell.md, never feature-feat-add-farewell.md.',
    )
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'feature-feat-',
        replacement: 'feature-add-farewell',
      }),
    )

    expect(report.findings).toHaveLength(1)
    expect(report.findings[0].carriesReplacement).toBe(true)
  })

  it('should state the corpus it opened against the corpus git listed', async () => {
    write('src/a.ts', 'const value = 1')
    write('src/b.ts', 'const value = 2')
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'nothing-matches-this',
        replacement: 'replacement',
      }),
    )

    expect(report.listed).toBe(2)
    expect(report.files).toBe(2)
    expect(report.skipped).toBe(0)
    expect(report.findings).toEqual([])
  })

  it('should skip a binary file rather than scanning its bytes', async () => {
    writeFileSync(join(ROOT, 'logo.bin'), Buffer.from([0x00, 0x01, 0x02]))
    git('add', '--all')

    const report = measured(
      await readSuperseded(ROOT, {
        superseded: 'anything',
        replacement: 'other',
      }),
    )

    expect(report.files).toBe(0)
    expect(report.skipped).toBe(1)
  })

  it('should refuse when the superseded value and its replacement are the same', async () => {
    const report = await readSuperseded(ROOT, {
      superseded: 'feature-',
      replacement: 'feature-',
    })

    expect(report.kind).toBe('unreadable')
  })

  it('should refuse an empty superseded value rather than matching every line', async () => {
    const report = await readSuperseded(ROOT, {
      superseded: '',
      replacement: 'feature-',
    })

    expect(report.kind).toBe('unreadable')
  })

  it('should refuse when git cannot list the corpus', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'aitk-gov-superseded-bare-'))

    const report = await readSuperseded(outside, {
      superseded: 'feature-feat-',
      replacement: 'feature-',
    })

    expect(report.kind).toBe('unreadable')
    rmSync(outside, { recursive: true, force: true })
  })
})
