import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readShipEntries, selectShipped } from '@/secrets/shipped'

let ROOT: string

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-shipped-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

function seedManifest(manifest: unknown): void {
  writeFileSync(join(ROOT, 'package.json'), JSON.stringify(manifest))
}

describe('readShipEntries', () => {
  it('should read the files field the package publishes', async () => {
    seedManifest({ name: 'x', files: ['src', 'docs', '!**/*.test.ts'] })

    expect(await readShipEntries(ROOT)).toEqual([
      'src',
      'docs',
      '!**/*.test.ts',
    ])
  })

  it('should refuse a manifest carrying no files field', async () => {
    seedManifest({ name: 'x' })

    expect(await readShipEntries(ROOT)).toBeUndefined()
  })

  it('should refuse a files field holding an empty list', async () => {
    seedManifest({ name: 'x', files: [] })

    expect(await readShipEntries(ROOT)).toBeUndefined()
  })

  it('should refuse a manifest that is not there', async () => {
    expect(await readShipEntries(ROOT)).toBeUndefined()
  })

  it('should refuse a manifest that does not parse', async () => {
    writeFileSync(join(ROOT, 'package.json'), '{ not json')

    expect(await readShipEntries(ROOT)).toBeUndefined()
  })
})

describe('selectShipped', () => {
  const FILES = [
    'src/cli.ts',
    'src/secrets/scan.ts',
    'src/secrets/scan.test.ts',
    'src/capture/run.ts',
    'scripts/core/verify.sh',
    'scripts/sandbox/run.sh',
    'docs/index.md',
    'tsconfig.json',
    '.claude/context/cli/audits.md',
  ]

  it('should keep a file under a shipped directory', () => {
    expect(selectShipped(FILES, ['docs'])).toEqual(['docs/index.md'])
  })

  it('should drop a file under no shipped entry', () => {
    expect(selectShipped(FILES, ['docs'])).not.toContain(
      '.claude/context/cli/audits.md',
    )
  })

  it('should drop what a negated directory entry excludes', () => {
    expect(selectShipped(FILES, ['scripts', '!scripts/sandbox'])).toEqual([
      'scripts/core/verify.sh',
    ])
  })

  it('should drop what a negated glob excludes', () => {
    expect(selectShipped(FILES, ['src/secrets', '!**/*.test.ts'])).toEqual([
      'src/secrets/scan.ts',
    ])
  })

  it('should keep a named file as well as a directory', () => {
    expect(selectShipped(FILES, ['tsconfig.json'])).toEqual(['tsconfig.json'])
  })

  it('should not treat a directory name as a prefix of a longer sibling', () => {
    expect(selectShipped(['source/a.ts', 'src/a.ts'], ['src'])).toEqual([
      'src/a.ts',
    ])
  })

  it('should apply every negation regardless of where it sits', () => {
    const entries = ['!**/*.test.ts', 'src']

    expect(selectShipped(FILES, entries)).toEqual([
      'src/capture/run.ts',
      'src/cli.ts',
      'src/secrets/scan.ts',
    ])
  })

  it('should report nothing when no entry matches', () => {
    expect(selectShipped(FILES, ['missing'])).toEqual([])
  })

  /**
   * npm packs these whether or not the field names them, so a corpus built
   * from the field alone would let a credential in one of them ship unseen.
   */
  it('should keep the root files npm packs regardless of the field', () => {
    const roots = ['package.json', 'README.md', 'LICENSE', 'src/a.ts']

    expect(selectShipped(roots, ['src'])).toEqual([
      'LICENSE',
      'README.md',
      'package.json',
      'src/a.ts',
    ])
  })

  it('should not treat a nested file of the same name as always packed', () => {
    expect(selectShipped(['docs/README.md'], ['src'])).toEqual([])
  })

  it('should still drop an always-packed file a negation excludes', () => {
    expect(selectShipped(['README.md'], ['src', '!README.md'])).toEqual([])
  })
})
