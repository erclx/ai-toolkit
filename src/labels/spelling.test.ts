import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseUnknownWords, scanTitleSpelling } from '@/labels/spelling'

// cspell:disable-next-line
const UNKNOWN_WORD = 'extensionlessqwerty'

describe('scanTitleSpelling', () => {
  it('should report a word no dictionary holds', async () => {
    const result = await scanTitleSpelling(
      `feat: fix the ${UNKNOWN_WORD} thing`,
      process.cwd(),
    )

    expect(result).toEqual({
      kind: 'checked',
      unknownWords: [UNKNOWN_WORD],
    })
  })

  it('should report an empty list for a conventional title', async () => {
    const result = await scanTitleSpelling(
      'feat(labels): add a fourth check to canon labels scan',
      process.cwd(),
    )

    expect(result).toEqual({ kind: 'checked', unknownWords: [] })
  })

  describe('binary resolution and exit handling', () => {
    let root: string

    beforeEach(() => {
      root = mkdtempSync(join(tmpdir(), 'canon-spelling-'))
    })

    afterEach(() => {
      rmSync(root, { recursive: true, force: true })
    })

    function writeFakeCspell(dir: string, script: string): void {
      const bin = join(dir, 'node_modules', '.bin')
      mkdirSync(bin, { recursive: true })
      const path = join(bin, 'cspell')
      writeFileSync(path, script)
      chmodSync(path, 0o755)
    }

    it('should resolve a binary from an ancestor when the root carries none', async () => {
      writeFakeCspell(root, '#!/bin/sh\nexit 0\n')
      const child = join(root, 'a', 'b')
      mkdirSync(child, { recursive: true })

      const result = await scanTitleSpelling('feat: anything', child)

      expect(result).toEqual({ kind: 'checked', unknownWords: [] })
    })

    it('should report unavailable with the probed root when no ancestor carries a binary', async () => {
      const result = await scanTitleSpelling('feat: anything', root)

      expect(result).toEqual({
        kind: 'unavailable',
        reason: 'no-binary',
        probedFrom: root,
      })
    })

    it('should report unavailable rather than a clean scan when the binary exits neither 0 nor 1', async () => {
      writeFakeCspell(root, '#!/bin/sh\necho "boom" >&2\nexit 42\n')

      const result = await scanTitleSpelling('feat: anything', root)

      expect(result).toEqual({
        kind: 'unavailable',
        reason: 'check-failed',
        message: 'boom',
      })
    })
  })
})

describe('parseUnknownWords', () => {
  it('should split cleanly on newlines', () => {
    expect(parseUnknownWords('foo\nbar\n')).toEqual(['foo', 'bar'])
  })

  it('should drop blank lines', () => {
    expect(parseUnknownWords('foo\n\n\nbar\n')).toEqual(['foo', 'bar'])
  })

  it('should report an empty list for empty output', () => {
    expect(parseUnknownWords('')).toEqual([])
  })
})
