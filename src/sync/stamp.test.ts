import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  hashContent,
  hashFile,
  readStamp,
  type StampSource,
  stampedCommit,
  stampedHashes,
  stampPath,
  toStampKey,
  writeStamp,
} from '@/sync/stamp'

let TARGET: string

const NOW = new Date('2026-07-30T12:00:00.000Z')

/** The toolkit root only dates the stamp, so a non-repo path exercises the fallback. */
const STANDARDS: StampSource = { domain: 'standards', toolkitRoot: '/nowhere' }
const SNIPPETS: StampSource = { domain: 'snippets', toolkitRoot: '/nowhere' }

function writeFixture(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function readRaw(target: string): Record<string, unknown> {
  return JSON.parse(readFileSync(stampPath(target), 'utf8'))
}

beforeEach(() => {
  TARGET = mkdtempSync(join(tmpdir(), 'aitk-stamp-'))
})

afterEach(() => {
  rmSync(TARGET, { recursive: true, force: true })
})

describe('hashFile', () => {
  it('should hash file bytes to the same digest as their content', () => {
    const path = join(TARGET, 'a.md')
    writeFixture(path, 'body\n')

    expect(hashFile(path)).toBe(hashContent('body\n'))
  })

  it('should produce a different digest for different content', () => {
    expect(hashContent('a')).not.toBe(hashContent('b'))
  })
})

describe('toStampKey', () => {
  it('should leave a posix path unchanged', () => {
    expect(toStampKey('.claude/standards/prose.md')).toBe(
      '.claude/standards/prose.md',
    )
  })
})

describe('readStamp', () => {
  it('should return undefined when no stamp exists', () => {
    expect(readStamp(TARGET)).toBeUndefined()
  })

  it('should return undefined for a corrupt stamp rather than throwing', () => {
    writeFixture(stampPath(TARGET), '{ not json')

    expect(readStamp(TARGET)).toBeUndefined()
  })

  it('should return undefined when required fields are missing', () => {
    writeFixture(stampPath(TARGET), JSON.stringify({ commit: 'abc' }))

    expect(readStamp(TARGET)).toBeUndefined()
  })

  it('should return undefined when a domain record is the wrong shape', () => {
    writeFixture(
      stampPath(TARGET),
      JSON.stringify({ covers: [], domains: { standards: 'not-a-record' } }),
    )

    expect(readStamp(TARGET)).toBeUndefined()
  })

  it('should return undefined when a file hash is not a string', () => {
    writeFixture(
      stampPath(TARGET),
      JSON.stringify({
        covers: [],
        domains: {
          standards: { syncedAt: 'now', files: { 'a.md': 42 } },
        },
      }),
    )

    expect(readStamp(TARGET)).toBeUndefined()
  })

  it('should return undefined for an unknown domain key', () => {
    writeFixture(
      stampPath(TARGET),
      JSON.stringify({
        covers: [],
        domains: { tooling: { syncedAt: 'now', files: {} } },
      }),
    )

    expect(readStamp(TARGET)).toBeUndefined()
  })

  it('should read back a stamp that was written', async () => {
    await writeStamp(TARGET, STANDARDS, { 'a.md': 'sha256:aa' }, NOW)

    expect(readStamp(TARGET)?.domains.standards?.syncedAt).toBe(
      NOW.toISOString(),
    )
  })
})

describe('writeStamp', () => {
  it('should record the hashes under the domain key', async () => {
    await writeStamp(TARGET, STANDARDS, { 'a.md': 'sha256:aa' }, NOW)

    expect(readStamp(TARGET)?.domains.standards?.files).toEqual({
      'a.md': 'sha256:aa',
    })
  })

  it('should preserve other domains when one domain is rewritten', async () => {
    await writeStamp(TARGET, STANDARDS, { 'a.md': 'sha256:aa' }, NOW)
    await writeStamp(TARGET, SNIPPETS, { 'b.md': 'sha256:bb' }, NOW)

    const stamp = readStamp(TARGET)

    expect(stamp?.domains.standards?.files).toEqual({ 'a.md': 'sha256:aa' })
    expect(stamp?.domains.snippets?.files).toEqual({ 'b.md': 'sha256:bb' })
  })

  it('should replace a domain rather than merge into it', async () => {
    await writeStamp(TARGET, STANDARDS, { 'old.md': 'sha256:aa' }, NOW)
    await writeStamp(TARGET, STANDARDS, { 'new.md': 'sha256:bb' }, NOW)

    expect(readStamp(TARGET)?.domains.standards?.files).toEqual({
      'new.md': 'sha256:bb',
    })
  })

  it('should sort file keys so a re-sync produces no diff', async () => {
    await writeStamp(
      TARGET,
      STANDARDS,
      { 'z.md': 'sha256:zz', 'a.md': 'sha256:aa' },
      NOW,
    )

    const domains = readRaw(TARGET).domains as Record<
      string,
      { files: Record<string, string> }
    >

    expect(Object.keys(domains.standards.files)).toEqual(['a.md', 'z.md'])
  })

  it('should name only the domains actually stamped', async () => {
    await writeStamp(TARGET, STANDARDS, {}, NOW)

    expect(readStamp(TARGET)?.covers).toEqual(['standards'])
  })

  it('should grow covers as each domain is stamped', async () => {
    await writeStamp(TARGET, STANDARDS, {}, NOW)
    await writeStamp(TARGET, SNIPPETS, {}, NOW)

    expect(readStamp(TARGET)?.covers).toEqual(['standards', 'snippets'])
  })

  it('should end the file with a newline', async () => {
    await writeStamp(TARGET, STANDARDS, {}, NOW)

    expect(readFileSync(stampPath(TARGET), 'utf8').endsWith('}\n')).toBe(true)
  })
})

describe('stampedCommit', () => {
  it('should keep each domain anchor independent of the others', () => {
    writeFixture(
      stampPath(TARGET),
      JSON.stringify({
        covers: ['standards', 'governance'],
        domains: {
          standards: { commit: 'old1111', syncedAt: 'then', files: {} },
          governance: { commit: 'new2222', syncedAt: 'now', files: {} },
        },
      }),
    )

    const stamp = readStamp(TARGET)

    expect(stampedCommit(stamp, 'standards')).toBe('old1111')
    expect(stampedCommit(stamp, 'governance')).toBe('new2222')
  })

  it('should not advance one domain anchor when another is rewritten', async () => {
    writeFixture(
      stampPath(TARGET),
      JSON.stringify({
        covers: ['standards'],
        domains: {
          standards: { commit: 'old1111', syncedAt: 'then', files: {} },
        },
      }),
    )

    await writeStamp(TARGET, SNIPPETS, {}, NOW)

    expect(stampedCommit(readStamp(TARGET), 'standards')).toBe('old1111')
  })

  it('should return undefined for an unstamped domain', () => {
    expect(stampedCommit(undefined, 'standards')).toBeUndefined()
  })
})

describe('stampedHashes', () => {
  it('should return an empty map when the stamp is absent', () => {
    expect(stampedHashes(undefined, 'standards')).toEqual({})
  })

  it('should return an empty map when the domain is unstamped', async () => {
    await writeStamp(TARGET, STANDARDS, { 'a.md': 'sha256:aa' }, NOW)

    expect(stampedHashes(readStamp(TARGET), 'governance')).toEqual({})
  })

  it('should return an empty map for an adapter with no stamp domain', async () => {
    await writeStamp(TARGET, STANDARDS, { 'a.md': 'sha256:aa' }, NOW)

    expect(stampedHashes(readStamp(TARGET), undefined)).toEqual({})
  })
})
