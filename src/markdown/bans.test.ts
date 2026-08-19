import { describe, expect, it } from 'vitest'
import { BAN_SETS, emptyBanSets } from '@/markdown/bans'
import { bodyLines, scanBans } from '@/markdown/scan'

/**
 * The sets as they shipped when they moved out of the standards.
 *
 * These are asserted rather than snapshotted so a widening or a narrowing of
 * any set fails here and names which one moved. The move was a relocation
 * rather than a loosening, and this is what holds it to that: the same 21
 * terms the parsed sets carried at `60fc97bf`.
 */
const CHARACTERS = ['—', ';']

const WORDS = [
  'seamless',
  'robust',
  'powerful',
  'revolutionary',
  'enhanced',
  'allows',
  'leverage',
  'simply',
  'just',
  'easily',
  'quickly',
  'very',
  'really',
]

const SPELLINGS = [
  'organise',
  'summarise',
  'recognise',
  'behaviour',
  'colour',
  'centre',
]

describe('BAN_SETS', () => {
  it('should ship the characters the punctuation rule states', () => {
    expect(BAN_SETS.characters).toEqual(CHARACTERS)
  })

  it('should ship the words the language rule states', () => {
    expect(BAN_SETS.words).toEqual(WORDS)
  })

  it('should ship the spellings the language rule reaches', () => {
    expect(BAN_SETS.spellings).toEqual(SPELLINGS)
  })

  it('should report one hit for each term the audit measures', () => {
    const terms = [...CHARACTERS, ...WORDS, ...SPELLINGS]
    const lines = bodyLines(terms.map((term) => `A ${term} line.`).join('\n'))

    const found = scanBans(lines, BAN_SETS)

    // One line per term and one term per line, so a count matching the set is
    // the whole set reaching the scan rather than a subset reaching it twice.
    expect(found).toHaveLength(terms.length)
    expect(new Set(found.map((hit) => hit.term))).toEqual(new Set(terms))
  })
})

describe('emptyBanSets', () => {
  it('should name no set when every one carries a term', () => {
    expect(emptyBanSets()).toEqual([])
  })

  it('should name each set that arrived empty', () => {
    // Absent is not empty. A scan with no terms finds nothing, and reporting
    // that as a clean file claims the prose passed when nothing was looked for.
    const found = emptyBanSets({ characters: [], words: WORDS, spellings: [] })

    expect(found).toEqual(['characters', 'spellings'])
  })
})
