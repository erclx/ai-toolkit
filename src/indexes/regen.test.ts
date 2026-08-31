import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exitCodeFor, type RegenResult, regenOne } from '@/indexes/regen'
import { findIndexedAncestor } from '@/indexes/walk'

let root: string

function buildFolder(options: { auto?: boolean; stale?: boolean } = {}): void {
  const auto = options.auto === false ? '\nauto: false' : ''
  const body = options.stale === false ? '\n- [A](a.md): First\n' : ''
  writeFileSync(
    join(root, 'index.md'),
    `---\ntitle: Fixture\nsubtitle: Sub${auto}\n---\n\n# Fixture\n\nSub\n${body}`,
  )
  writeFileSync(
    join(root, 'a.md'),
    '---\ntitle: A\ndescription: First\n---\n\nbody\n',
  )
}

function buildResult(action: RegenResult['action']): RegenResult {
  return { path: '/tmp/index.md', action }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'canon-regen-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('regenOne', () => {
  it('should write the index when the folder has drifted', async () => {
    buildFolder()

    const result = await regenOne(root, { dryRun: false })

    expect(result.action).toBe('written')
    expect(readFileSync(join(root, 'index.md'), 'utf8')).toContain(
      '- [A](a.md): First',
    )
  })

  it('should report drift without writing under dry run', async () => {
    buildFolder()
    const before = readFileSync(join(root, 'index.md'), 'utf8')

    const result = await regenOne(root, { dryRun: true })

    expect(result.action).toBe('would-write')
    expect(readFileSync(join(root, 'index.md'), 'utf8')).toBe(before)
  })

  it('should report unchanged when the index already matches', async () => {
    buildFolder({ stale: false })

    const result = await regenOne(root, { dryRun: false })

    expect(result.action).toBe('unchanged')
  })

  it('should skip a folder marked auto false without rewriting it', async () => {
    buildFolder({ auto: false })

    const result = await regenOne(root, { dryRun: false })

    expect(result).toMatchObject({ action: 'skipped', reason: 'auto:false' })
    expect(readFileSync(join(root, 'index.md'), 'utf8')).not.toContain(
      '- [A](a.md)',
    )
  })

  it('should error when the folder has no index to regenerate', async () => {
    const result = await regenOne(root, { dryRun: false })

    expect(result).toMatchObject({ action: 'error', reason: 'no index.md' })
  })

  it('should error when a sibling is missing a required field', async () => {
    writeFileSync(
      join(root, 'index.md'),
      '---\ntitle: Fixture\nsubtitle: Sub\n---\n\n# Fixture\n\nSub\n',
    )
    writeFileSync(join(root, 'a.md'), '---\ntitle: A\n---\n\nbody\n')

    const result = await regenOne(root, { dryRun: false })

    expect(result).toMatchObject({ action: 'error', reason: 'frontmatter' })
  })
})

describe('exitCodeFor', () => {
  it('should return 0 when every folder is clean', () => {
    const results = [buildResult('unchanged'), buildResult('skipped')]
    expect(exitCodeFor(results, { dryRun: false })).toBe(0)
  })

  it('should return 1 when any folder errored', () => {
    const results = [buildResult('written'), buildResult('error')]
    expect(exitCodeFor(results, { dryRun: false })).toBe(1)
  })

  it('should return 2 when a dry run finds drift', () => {
    expect(exitCodeFor([buildResult('would-write')], { dryRun: true })).toBe(2)
  })

  it('should rank an error above drift when both are present', () => {
    const results = [buildResult('would-write'), buildResult('error')]
    expect(exitCodeFor(results, { dryRun: true })).toBe(1)
  })
})

describe('findIndexedAncestor', () => {
  it('should resolve a nested file up to its nearest indexed folder', () => {
    mkdirSync(join(root, 'nested'), { recursive: true })
    writeFileSync(join(root, 'index.md'), '---\ntitle: T\nsubtitle: S\n---\n')
    writeFileSync(join(root, 'nested', 'page.md'), 'body\n')

    expect(findIndexedAncestor(join(root, 'nested', 'page.md'), root)).toBe(
      root,
    )
  })

  it('should return undefined when no ancestor under root is indexed', () => {
    mkdirSync(join(root, 'nested'), { recursive: true })
    writeFileSync(join(root, 'nested', 'page.md'), 'body\n')

    expect(
      findIndexedAncestor(join(root, 'nested', 'page.md'), root),
    ).toBeUndefined()
  })

  it('should return undefined for a path that does not exist', () => {
    expect(findIndexedAncestor(join(root, 'missing.md'), root)).toBeUndefined()
  })
})
