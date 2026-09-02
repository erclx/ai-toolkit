import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BASELINE_REL } from '@/audits/baseline'
import type { CommandResult, MeasureContext } from '@/gate/measures'
import {
  AUDITS_BASELINE,
  captureStamps,
  recordIdempotence,
} from '@/gate/measures'

describe('AUDITS_BASELINE', () => {
  it('should agree with the path audits/baseline.ts writes', () => {
    expect(AUDITS_BASELINE).toBe(BASELINE_REL)
  })
})

describe('captureStamps', () => {
  let root: string

  const refuse = () => {
    throw new Error('captureStamps runs no command')
  }

  const context = (): MeasureContext => ({
    root,
    ci: false,
    run: refuse,
    cli: refuse,
  })

  /**
   * A whole capture set whose stamp agrees with both files beside it, which is
   * what a tree looks like directly after `canon capture` wrote all three.
   */
  const writeSet = (base: string, markup: string): void => {
    const html = `<html>${markup}</html>`
    const png = `${base} image bytes`
    writeFileSync(join(root, 'assets', `${base}.html`), html)
    writeFileSync(join(root, 'assets', `${base}.png`), png)
    writeFileSync(
      join(root, 'assets', `${base}.stamp`),
      [
        `source: ${base}.html`,
        `source-sha256: ${digest(html)}`,
        `image-sha256: ${digest(png)}`,
        '',
      ].join('\n'),
    )
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'canon-capture-stamps-'))
    mkdirSync(join(root, 'assets'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('reports nothing where a tree carries no capture at all', async () => {
    const report = await captureStamps(context())

    expect(report).toEqual({ emissions: [] })
  })

  it('reports nothing where every set agrees with its stamp', async () => {
    writeSet('hero', 'hero')
    writeSet('install', 'install')

    const report = await captureStamps(context())

    expect(report).toEqual({ emissions: [] })
  })

  it('catches markup edited after the capture that stamped it', async () => {
    writeSet('hero', 'hero')
    writeFileSync(join(root, 'assets', 'hero.html'), '<html>moved</html>')

    const report = await captureStamps(context())

    expect(report.failure).toBeDefined()
    expect(report.emissions[0]?.text).toContain('assets/hero.html hashes to')
  })

  it('covers the install set as well as the hero one', async () => {
    writeSet('hero', 'hero')
    writeSet('install', 'install')
    writeFileSync(join(root, 'assets', 'install.png'), 'replaced')

    const report = await captureStamps(context())

    expect(report.failure).toBeDefined()
    expect(report.emissions[0]?.text).toContain('assets/install.png hashes to')
  })

  it('names what a half-written set is missing rather than reading its stamp', async () => {
    writeSet('install', 'install')
    rmSync(join(root, 'assets', 'install.stamp'))

    const report = await captureStamps(context())

    expect(report.emissions[0]?.text).toBe(
      'Missing from the install set: assets/install.stamp',
    )
  })

  it('stays silent on one absent set while reading the other', async () => {
    writeSet('hero', 'hero')

    const report = await captureStamps(context())

    expect(report).toEqual({ emissions: [] })
  })

  it('reads a frame added later, since the bases come off the folder', async () => {
    writeSet('hero', 'hero')
    writeSet('release', 'release')
    writeFileSync(join(root, 'assets', 'release.html'), '<html>moved</html>')

    const report = await captureStamps(context())

    expect(report.failure).toBeDefined()
    expect(report.emissions[0]?.text).toContain('assets/release.html hashes to')
  })

  it('leaves an image that is not a capture source alone', async () => {
    writeSet('hero', 'hero')
    writeFileSync(join(root, 'assets', 'logo.png'), 'not a capture')

    const report = await captureStamps(context())

    expect(report).toEqual({ emissions: [] })
  })
})

describe('recordIdempotence', () => {
  const refuse = () => {
    throw new Error('recordIdempotence reads the CLI and nothing else')
  }

  const context = (result: Partial<CommandResult>): MeasureContext => ({
    root: '/nowhere',
    ci: false,
    run: refuse,
    cli: async () => ({
      exitCode: 0,
      stdout: '',
      stderr: '',
      all: '',
      ...result,
    }),
  })

  /**
   * What the verb writes on a tree it could read. Exit `2` is a plan drawn and
   * left unwritten, which is every reading but the one with nothing to do.
   */
  const planned = (
    moves: readonly unknown[],
    rewritten: number,
    paths: readonly unknown[] = [],
  ): Partial<CommandResult> => ({
    exitCode: moves.length === 0 && rewritten === 0 ? 0 : 2,
    stdout: `${JSON.stringify({ moves, rewritten, paths })}\n`,
  })

  const cited = [
    { path: '.claude/context/development/scratch.md', rewritten: 1 },
    { path: '.claude/context/sandbox/authoring.md', rewritten: 1 },
  ]

  it('passes where the records have moved and a re-run would rewrite nothing', async () => {
    const report = await recordIdempotence(context(planned([], 0)))

    expect(report.failure).toBeUndefined()
    expect(report.unmeasured).toBeUndefined()
    expect(report.emissions[0]?.text).toContain('rewrites nothing')
  })

  it('fails where the records have moved and a citation still names the old root', async () => {
    const report = await recordIdempotence(context(planned([], 2)))

    expect(report.failure).toContain('2 citation(s) still name the old root')
    expect(report.failure).toContain('canon-keep-record-root')
  })

  it('names each file the sweep would rewrite, so the count is actionable', async () => {
    const report = await recordIdempotence(context(planned([], 2, cited)))

    expect(report.emissions.map((emission) => emission.text)).toEqual([
      '.claude/context/development/scratch.md (1)',
      '.claude/context/sandbox/authoring.md (1)',
    ])
  })

  it('keeps the finding where the payload names no path to list', async () => {
    const report = await recordIdempotence(
      context({ exitCode: 2, stdout: '{"moves":[],"rewritten":2}\n' }),
    )

    expect(report.failure).toContain('2 citation(s)')
    expect(report.emissions).toEqual([])
  })

  it('reports without failing where the folders have yet to move', async () => {
    const move = { from: '.claude/memory', to: '.canon/memory' }

    const report = await recordIdempotence(context(planned([move], 14)))

    expect(report.failure).toBeUndefined()
    expect(report.emissions[0]?.text).toContain('1 record folder(s)')
    expect(report.emissions[0]?.text).toContain('14 citation(s)')
  })

  it('reads a refusal exit as unmeasured rather than as a pass', async () => {
    const report = await recordIdempotence(context({ exitCode: 1 }))

    expect(report.failure).toBeUndefined()
    expect(report.unmeasured).toContain('exit 1')
  })

  it('reads a payload carrying no plan as unmeasured', async () => {
    const report = await recordIdempotence(
      context({ exitCode: 2, stdout: 'not a record\n' }),
    )

    expect(report.failure).toBeUndefined()
    expect(report.unmeasured).toContain('carried no plan')
  })
})

function digest(content: string): string {
  return new Bun.CryptoHasher('sha256').update(content).digest('hex')
}
