import { describe, expect, it } from 'vitest'
import {
  AUDITS,
  auditFor,
  classify,
  countsFor,
  isTracked,
} from '@/audits/catalog'

function specFor(id: string) {
  const spec = auditFor(id)
  if (spec === undefined) throw new Error(`No audit registered as ${id}`)
  return spec
}

describe('the audit catalog', () => {
  it('should register every audit under a unique id', () => {
    const ids = AUDITS.map((audit) => audit.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should give every audit a non-empty argv ending in --json', () => {
    for (const audit of AUDITS) {
      expect(audit.argv.length).toBeGreaterThan(0)
      expect(audit.argv.at(-1)).toBe('--json')
    }
  })

  /**
   * The three that gate are the three `verify.sh` already runs. A fourth
   * arriving here silently widens what fails a push, which is the split the
   * audits entry records and the one this aggregate exists not to move.
   */
  it('should gate on exactly the three checks that already gate a push', () => {
    const gating = AUDITS.filter((audit) => audit.gatingExits.length > 0).map(
      (audit) => audit.id,
    )

    expect(gating.sort()).toEqual(['context', 'markdown', 'skills'])
  })

  it('should treat a gitignored record folder as a per-machine corpus', () => {
    expect(isTracked(specFor('records-plans'))).toBe(false)
    expect(isTracked(specFor('records-standards'))).toBe(true)
    expect(isTracked(specFor('tasks'))).toBe(false)
    expect(isTracked(specFor('markdown'))).toBe(true)
  })
})

describe('reading counts out of each record shape', () => {
  const contextRecord = {
    citations: { scanned: 776, total: 179, unresolved: [{ path: 'a.md' }] },
    length: [{ rel: 'a.md' }, { rel: 'b.md' }],
    missingSections: [],
    indexDrift: [{ rel: 'c.md' }],
    entries: [{ bareReferences: [{ line: 4 }] }, { bareReferences: [] }],
    architecture: {
      rel: '.claude/ARCHITECTURE.md',
      lines: 162,
      ceiling: 178,
      decisions: [
        { claim: 'countable', checks: [] },
        { claim: 'invariant', checks: ['scripts/core/check.sh'] },
        { claim: 'neither', checks: [] },
      ],
    },
  }

  it('should count the context audit findings by their own arrays', () => {
    expect(countsFor(specFor('context'), contextRecord)).toEqual({
      unresolvedCitations: 1,
      longEntries: 2,
      missingSections: 0,
      indexDrift: 1,
      bareReferences: 1,
      recordOverLength: 0,
      recordUnverifiable: 1,
      recordUnchecked: 1,
    })
  })

  it('should count a record past its own ceiling as over length', () => {
    const record = {
      ...contextRecord,
      architecture: { ...contextRecord.architecture, lines: 179 },
    }

    expect(countsFor(specFor('context'), record)?.recordOverLength).toBe(1)
  })

  /**
   * A project entitled to carry no architecture record still has context
   * folders worth counting, and a zero under the record keys there would read
   * as a conforming record rather than as an absent one.
   */
  it('should count the folders alone when the project carries no record', () => {
    const record = { ...contextRecord, architecture: null }

    expect(countsFor(specFor('context'), record)).toEqual({
      unresolvedCitations: 1,
      longEntries: 2,
      missingSections: 0,
      indexDrift: 1,
      bareReferences: 1,
    })
  })

  it('should return no counts for a context record carrying no architecture key', () => {
    const { architecture, ...record } = contextRecord

    expect(countsFor(specFor('context'), record)).toBeUndefined()
  })

  it('should sum the markdown weights across every measured entry', () => {
    const record = {
      checkpoints: { run: 40 },
      entries: [
        {
          bans: [{ line: 1 }],
          longestRun: 73,
          heavyBullets: [{ line: 2 }, { line: 3 }],
          heavyParagraphs: [{ line: 4 }],
          cadence: { measured: 35, flat: 2 },
        },
        {
          bans: [],
          longestRun: 12,
          heavyBullets: [],
          heavyParagraphs: [{ line: 9 }],
          cadence: { measured: 10, flat: 1 },
        },
      ],
    }

    expect(countsFor(specFor('markdown'), record)).toEqual({
      bans: 1,
      heavyBullets: 2,
      heavyParagraphs: 2,
      filesPastDepth: 1,
      flatParagraphs: 3,
    })
  })

  /**
   * A file the audit measured no cadence on reports no `cadence` key at all,
   * which is a file below the measuring floor rather than a file with no flat
   * paragraph. Reading the absent key as zero would fold those two together.
   */
  it('should skip a markdown entry carrying no cadence reading', () => {
    const record = {
      checkpoints: { run: 40 },
      entries: [
        { bans: [], longestRun: 3, heavyBullets: [], heavyParagraphs: [] },
      ],
    }

    expect(countsFor(specFor('markdown'), record)?.flatParagraphs).toBe(0)
  })

  it('should count each skill finding array under its own name', () => {
    const record = {
      findings: {
        missingRequirement: [{ name: 'a' }],
        nameMismatch: [],
        missingDescription: [],
        longDescription: [{ name: 'b' }],
        readme: [],
        folderName: [],
        requirementSections: [],
      },
    }

    expect(countsFor(specFor('skills'), record)).toEqual({
      missingRequirement: 1,
      nameMismatch: 0,
      missingDescription: 0,
      longDescription: 1,
      readme: 0,
      folderName: 0,
      requirementSections: 0,
    })
  })

  it('should keep the board findings and its untested rows apart', () => {
    const record = { ok: true, findings: [{ kind: 'x' }], untested: [{}, {}] }

    expect(countsFor(specFor('tasks'), record)).toEqual({
      findings: 1,
      untested: 2,
    })
  })

  it('should count a record kind by its findings alone', () => {
    const record = { ok: true, kind: 'plans', records: 3, findings: [{}, {}] }

    expect(countsFor(specFor('records-plans'), record)).toEqual({ findings: 2 })
  })

  it('should sum the degradation hits across every scanned language', () => {
    const record = {
      snapshot: [
        { language: 'ts', degradationHits: [{}, {}] },
        { language: 'sh', degradationHits: [{}] },
      ],
    }

    expect(countsFor(specFor('comments'), record)).toEqual({
      degradationHits: 3,
    })
  })

  it('should report the test-order findings beside what it could not classify', () => {
    const record = {
      kind: 'measured',
      satisfied: [{}],
      findings: [],
      unclassified: [{}, {}, {}],
    }

    expect(countsFor(specFor('test-order'), record)).toEqual({
      findings: 0,
      unclassified: 3,
    })
  })

  /**
   * Absent rather than zero, for the reason the context audit already states
   * about `--citations-only`. A record the extractor could not read is a
   * measure that did not run, and zero there reads as a clean corpus.
   */
  it('should return no counts for a record missing the keys it reads', () => {
    expect(countsFor(specFor('markdown'), { unrelated: true })).toBeUndefined()
    expect(countsFor(specFor('context'), null)).toBeUndefined()
    expect(countsFor(specFor('tasks'), 'not an object')).toBeUndefined()
  })
})

describe('classifying an audit run by its exit code', () => {
  const markdown = specFor('markdown')
  const comments = specFor('comments')

  it('should read a zero exit carrying a parseable record as clean', () => {
    const result = classify(markdown, 0, '{"entries":[],"checkpoints":{}}')

    expect(result.status).toBe('clean')
    expect(result.counts).toEqual({
      bans: 0,
      heavyBullets: 0,
      heavyParagraphs: 0,
      filesPastDepth: 0,
      flatParagraphs: 0,
    })
  })

  it('should read a gating exit as a finding that fails the aggregate', () => {
    const record = JSON.stringify({
      checkpoints: { run: 40 },
      entries: [
        {
          bans: [{ line: 1 }],
          longestRun: 3,
          heavyBullets: [],
          heavyParagraphs: [],
        },
      ],
    })

    const result = classify(markdown, 2, record)

    expect(result.status).toBe('finding')
    expect(result.counts?.bans).toBe(1)
  })

  it('should read the empty-ban-set exit as a finding rather than a refusal', () => {
    const result = classify(markdown, 3, '{"entries":[],"checkpoints":{}}')

    expect(result.status).toBe('finding')
  })

  /**
   * A judgment verb sets 2 on findings it never gates on, so the exit alone
   * cannot say whether a finding is a fact. The catalog decides, not the code.
   */
  it('should read a findings exit from a reporting verb as reported', () => {
    const result = classify(comments, 2, '{"snapshot":[]}')

    expect(result.status).toBe('reported')
  })

  it('should read a refusal as unmeasured and keep its reason', () => {
    const result = classify(comments, 1, '{"ok":false,"reason":"no-folder"}')

    expect(result.status).toBe('unmeasured')
    expect(result.reason).toContain('no-folder')
  })

  /**
   * Every gitignored record folder is absent on a fresh clone and in CI, so
   * six of the twelve refuse there on every run. Counting those as unmeasured
   * makes the incomplete verdict permanent, which is a signal nobody reads
   * after the second time they see it.
   */
  it('should read an absent per-machine corpus as absent rather than unmeasured', () => {
    const result = classify(
      specFor('records-plans'),
      1,
      '{"ok":false,"reason":"no-folder","message":"No plans folder"}',
    )

    expect(result.status).toBe('absent')
  })

  it('should read an absent board as absent under its own reason', () => {
    const result = classify(
      specFor('tasks'),
      1,
      '{"ok":false,"reason":"no-board","message":"No task board"}',
    )

    expect(result.status).toBe('absent')
  })

  /**
   * Absence is expected only where the corpus is one machine's. A tracked tree
   * that cannot be found is a defect in the checkout, and reading it as an
   * ordinary absence would report a pass over a corpus that ships to targets.
   */
  it('should read an absent tracked corpus as unmeasured', () => {
    const result = classify(
      specFor('records-standards'),
      1,
      '{"ok":false,"reason":"no-folder","message":"No standards folder"}',
    )

    expect(result.status).toBe('unmeasured')
  })

  it('should read a per-machine refusal for any other reason as unmeasured', () => {
    const result = classify(
      specFor('records-plans'),
      1,
      '{"ok":false,"reason":"unknown-kind","message":"Not a record kind"}',
    )

    expect(result.status).toBe('unmeasured')
  })

  it('should read unparseable output as unmeasured rather than as clean', () => {
    const result = classify(markdown, 0, 'not json at all')

    expect(result.status).toBe('unmeasured')
    expect(result.counts).toBeUndefined()
  })

  it('should read an exit the verb never documents as unmeasured', () => {
    const result = classify(comments, 137, '')

    expect(result.status).toBe('unmeasured')
    expect(result.reason).toContain('137')
  })
})
