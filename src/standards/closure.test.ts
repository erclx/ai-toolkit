import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  citedStandards,
  normalizeName,
  parseSelection,
  selectStandards,
} from '@/standards/closure'
import { planInstall } from '@/standards/install'

const dirs: string[] = []

/** Writes a source root from name to body and returns the flat listing. */
async function makeCorpus(bodies: Record<string, string>) {
  const dir = await mkdtemp(join(tmpdir(), 'aitk-standards-closure-'))
  dirs.push(dir)

  await Promise.all(
    Object.entries(bodies).map(([name, body]) =>
      writeFile(join(dir, name), body),
    ),
  )

  return planInstall(dir)
}

afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  )
})

describe('normalizeName', () => {
  it('should append the extension when the name omits it', () => {
    expect(normalizeName('prose')).toBe('prose.md')
  })

  it('should leave a name that already carries the extension alone', () => {
    expect(normalizeName('prose.md')).toBe('prose.md')
  })

  it('should trim surrounding whitespace', () => {
    expect(normalizeName('  prose  ')).toBe('prose.md')
  })
})

describe('parseSelection', () => {
  it('should split a comma-separated list', () => {
    expect(parseSelection('prose,skill')).toEqual(['prose.md', 'skill.md'])
  })

  it('should drop empty entries from a trailing comma', () => {
    expect(parseSelection('prose,,skill,')).toEqual(['prose.md', 'skill.md'])
  })

  it('should return nothing for an empty selection', () => {
    expect(parseSelection('')).toEqual([])
  })
})

describe('citedStandards', () => {
  const available = new Set(['prose.md', 'skill.md', 'versioning.md'])

  it('should read a backticked sibling citation', () => {
    expect(citedStandards('See `prose.md` for voice.', available)).toEqual([
      'prose.md',
    ])
  })

  it('should resolve a path-prefixed citation by its basename', () => {
    expect(
      citedStandards('`standards/versioning.md` governs it.', available),
    ).toEqual(['versioning.md'])
  })

  it('should drop a citation that names no installable standard', () => {
    expect(
      citedStandards('`.claude/ARCHITECTURE.md` holds it.', available),
    ).toEqual([])
  })

  it('should drop a citation differing only in case', () => {
    expect(citedStandards('Write `SKILL.md` at the root.', available)).toEqual(
      [],
    )
  })

  it('should ignore a filename written without backticks', () => {
    expect(citedStandards('See prose.md for voice.', available)).toEqual([])
  })

  it('should report each sibling once', () => {
    expect(
      citedStandards('`prose.md` and again `prose.md`.', available),
    ).toEqual(['prose.md'])
  })
})

describe('selectStandards', () => {
  it('should return every standard for the all selection', async () => {
    const available = await makeCorpus({
      'prose.md': '# prose\n',
      'skill.md': '# skill\n',
    })

    const result = selectStandards(available, 'all')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.files.map((file) => file.name)).toEqual([
      'prose.md',
      'skill.md',
    ])
    expect(result.selection.added).toEqual([])
  })

  it('should treat an empty selection as all', async () => {
    const available = await makeCorpus({ 'prose.md': '# prose\n' })

    const result = selectStandards(available, '')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.files).toHaveLength(1)
  })

  it('should install a standard that cites nothing on its own', async () => {
    const available = await makeCorpus({
      'slug.md': '# slug\n',
      'prose.md': '# prose\n',
    })

    const result = selectStandards(available, 'slug')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.files.map((file) => file.name)).toEqual(['slug.md'])
    expect(result.selection.added).toEqual([])
  })

  it('should pull in a standard the selection cites', async () => {
    const available = await makeCorpus({
      'skill.md': 'Follow `prose.md`.\n',
      'prose.md': '# prose\n',
      'slug.md': '# slug\n',
    })

    const result = selectStandards(available, 'skill')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.files.map((file) => file.name)).toEqual([
      'prose.md',
      'skill.md',
    ])
    expect(result.selection.requested).toEqual(['skill.md'])
    expect(result.selection.added).toEqual(['prose.md'])
  })

  it('should follow a citation transitively', async () => {
    const available = await makeCorpus({
      'skill.md': 'Follow `prose.md`.\n',
      'prose.md': 'Follow `versioning.md`.\n',
      'versioning.md': '# versioning\n',
      'slug.md': '# slug\n',
    })

    const result = selectStandards(available, 'skill')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.added).toEqual(['prose.md', 'versioning.md'])
  })

  it('should terminate on a citation cycle', async () => {
    const available = await makeCorpus({
      'prose.md': 'Follow `versioning.md`.\n',
      'versioning.md': 'Follow `prose.md`.\n',
    })

    const result = selectStandards(available, 'prose')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.files.map((file) => file.name)).toEqual([
      'prose.md',
      'versioning.md',
    ])
  })

  it('should compute the closure over the union of several names', async () => {
    const available = await makeCorpus({
      'design.md': 'Follow `prose.md`.\n',
      'tasks.md': 'Follow `versioning.md`.\n',
      'prose.md': '# prose\n',
      'versioning.md': '# versioning\n',
    })

    const result = selectStandards(available, 'design,tasks')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.requested).toEqual(['design.md', 'tasks.md'])
    expect(result.selection.added).toEqual(['prose.md', 'versioning.md'])
  })

  it('should not report a requested standard as added when a sibling cites it', async () => {
    const available = await makeCorpus({
      'skill.md': 'Follow `prose.md`.\n',
      'prose.md': '# prose\n',
    })

    const result = selectStandards(available, 'skill,prose')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.added).toEqual([])
  })

  it('should accept a name spelled with its extension', async () => {
    const available = await makeCorpus({ 'prose.md': '# prose\n' })

    const result = selectStandards(available, 'prose.md')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.requested).toEqual(['prose.md'])
  })

  it('should reject a name no standard carries', async () => {
    const available = await makeCorpus({ 'prose.md': '# prose\n' })

    const result = selectStandards(available, 'prose,missing')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.unknown).toEqual(['missing.md'])
  })

  it('should not pull in a standard cited only from outside the selection', async () => {
    const available = await makeCorpus({
      'skill.md': 'Follow `prose.md`.\n',
      'prose.md': '# prose\n',
    })

    const result = selectStandards(available, 'prose')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.selection.files.map((file) => file.name)).toEqual([
      'prose.md',
    ])
  })
})
