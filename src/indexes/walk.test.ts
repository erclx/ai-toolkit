import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listIndexes } from '@/indexes/walk'

let root: string

function seedIndex(relativeDir: string): void {
  const dir = join(root, relativeDir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'index.md'),
    '---\ntitle: T\nsubtitle: S\n---\n\n# T\n\nS\n',
  )
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'aitk-walk-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('listIndexes', () => {
  it('should skip vendored and git trees outside a git repository', async () => {
    seedIndex('real')
    seedIndex('node_modules/pkg')
    seedIndex('.git/weird')

    const found = await listIndexes(root)

    expect(found).toEqual([join(root, 'real', 'index.md')])
  })

  it('should find a nested index at any depth', async () => {
    seedIndex('a/b/c')

    const found = await listIndexes(root)

    expect(found).toEqual([join(root, 'a', 'b', 'c', 'index.md')])
  })

  it('should return an empty list when nothing is indexed', async () => {
    mkdirSync(join(root, 'plain'), { recursive: true })

    expect(await listIndexes(root)).toEqual([])
  })

  it('should sort results so index output is deterministic', async () => {
    seedIndex('zebra')
    seedIndex('alpha')

    const found = await listIndexes(root)

    expect(found).toEqual([
      join(root, 'alpha', 'index.md'),
      join(root, 'zebra', 'index.md'),
    ])
  })
})
