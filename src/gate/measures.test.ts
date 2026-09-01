import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BASELINE_REL } from '@/audits/baseline'
import type { MeasureContext } from '@/gate/measures'
import { AUDITS_BASELINE, captureStamps } from '@/gate/measures'

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

function digest(content: string): string {
  return new Bun.CryptoHasher('sha256').update(content).digest('hex')
}
