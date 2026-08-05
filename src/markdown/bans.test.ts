import { describe, expect, it } from 'vitest'
import {
  banReport,
  loadStandards,
  parseCharacterBans,
  parseSpellingBans,
  parseWordBans,
} from '@/markdown/bans'

/**
 * The sets as the shipped standards state them today.
 *
 * These are asserted rather than snapshotted so a reformat of either standard
 * fails loudly here. Parsing prose authored for humans is what buys one
 * definition of each ban, and the cost is that a rewrite can silently narrow
 * the check, which is exactly what this catches.
 */
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

/**
 * `analyse` is absent because the standard cannot reach it as written. Its
 * example is `analyze`, which ends in `-yze` rather than the `-ize` its rule
 * states, so no listed pair transforms it. The fix belongs in the standard's
 * sentence rather than in a special case here, which would put the rule back in
 * code and hide that the standard understates itself.
 */
const SPELLINGS = [
  'organise',
  'summarise',
  'recognise',
  'behaviour',
  'colour',
  'centre',
]

describe('banReport', () => {
  it('should read both closed sets out of the shipped standards', async () => {
    const report = banReport(await loadStandards(process.cwd()))

    expect(report.missing).toEqual([])
    expect(report.characters).toEqual(['—', ';'])
    expect(report.words).toEqual(WORDS)
    expect(report.spellings).toEqual(SPELLINGS)
  })

  it('should name a standard it found under neither root', () => {
    const report = banReport({
      markdown: undefined,
      prose: { source: 'standards/prose.md', text: '' },
      missing: ['markdown.md'],
    })

    // Absent is not empty. A scan with no terms finds nothing, and reporting
    // that as a clean file claims the prose passed when nothing was looked for.
    expect(report.missing).toEqual(['markdown.md'])
    expect(report.characters).toEqual([])
  })
})

describe('parseWordBans', () => {
  it('should take the single lowercase words out of a ban bullet', () => {
    const standard = '## Language\n\n- Do not use filler (`simply`, `just`)\n'

    expect(parseWordBans(standard)).toEqual(['simply', 'just'])
  })

  it('should leave a multi-word ban to the reader', () => {
    const standard =
      "## Language\n\n- Do not use the pattern (`It's not X, it's Y`)\n"

    // A placeholder stands in for the rest of the sentence, so no literal match
    // reaches it and a loose one would report every sentence carrying "not".
    expect(parseWordBans(standard)).toEqual([])
  })

  it('should stop at the next section', () => {
    const standard =
      '## Language\n\n- Do not use filler (`simply`)\n\n## Other\n\n- Do not use `elsewhere`\n'

    expect(parseWordBans(standard)).toEqual(['simply'])
  })

  it('should read nothing when the section is renamed', () => {
    const standard = '## Words\n\n- Do not use filler (`simply`)\n'

    expect(parseWordBans(standard)).toEqual([])
  })

  it('should ignore a ban bullet quoted inside a fenced example', () => {
    const standard =
      '## Language\n\n```markdown\n- Do not use filler (`quoted`)\n```\n\n- Do not use filler (`simply`)\n'

    expect(parseWordBans(standard)).toEqual(['simply'])
  })
})

describe('parseCharacterBans', () => {
  it('should take the single characters out of a ban bullet', () => {
    const standard =
      '## Punctuation\n\n- Do not use em dashes (`—`) or semicolons (`;`).\n'

    expect(parseCharacterBans(standard)).toEqual(['—', ';'])
  })

  it('should leave a quoted clause unread', () => {
    const standard =
      '## Punctuation\n\n- Do not use parenthetical asides (`the config (which is optional) controls...`).\n'

    // Width separates the two ban classes in that section, and a clause is a
    // shape no literal match should be built from.
    expect(parseCharacterBans(standard)).toEqual([])
  })
})

describe('parseSpellingBans', () => {
  it('should apply the stated suffix rules to the stated examples', () => {
    const standard =
      '## Language\n\n- Use American English spelling. Prefer `-ize` over `-ise`, `-or` over `-our`, `-er` over `-re` (`organize`, `behavior`, `center`)\n'

    expect(parseSpellingBans(standard)).toEqual([
      'organise',
      'behaviour',
      'centre',
    ])
  })

  it('should read nothing when the suffix pairs do not pair off', () => {
    const standard =
      '## Language\n\n- Use American English spelling. Prefer `-ize` (`organize`)\n'

    // Pairing what is there would invent a rule from half a sentence.
    expect(parseSpellingBans(standard)).toEqual([])
  })

  it('should skip an example matching no stated suffix', () => {
    const standard =
      '## Language\n\n- Use American English spelling. Prefer `-ize` over `-ise` (`organize`, `program`)\n'

    expect(parseSpellingBans(standard)).toEqual(['organise'])
  })
})
