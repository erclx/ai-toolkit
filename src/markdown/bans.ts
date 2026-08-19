import type { BanSets } from '@/markdown/scan'

/**
 * Single characters `markdown.md` bans under `## Punctuation`.
 *
 * The parenthetical-aside ban in that section is absent because it quotes a
 * whole clause, and a literal match built from a clause reports the compliant
 * text and reaches none of the violations.
 */
const CHARACTERS = ['—', ';'] as const

/**
 * Single lowercase words `markdown.md` bans under `## Language`.
 *
 * A multi-word ban is absent by the same test the character set applies. The
 * standard bans a pattern like `It's not X, it's Y` with a placeholder standing
 * in for the rest of the sentence, so no literal match reaches it and the
 * phrase bans stay a reader's judgment.
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
] as const

/**
 * British spellings of the American examples `markdown.md` lists.
 *
 * The set is carried whole rather than derived from a suffix rule, because a
 * suffix pattern run over prose produced 46 of the 58 false positives measured
 * during intake: `exercises`, `promises`, and `revised` all end in `-ise` and
 * none is a British spelling. Matching whole words reaches none of them.
 *
 * `analyse` is absent because the standard's example is `analyze`, which ends
 * in `-yze` rather than the `-ize` its rule states. The set records what the
 * standard reaches rather than what a reader would extend it to, so adding the
 * spelling here would widen the check past the prose it answers to.
 */
const SPELLINGS = [
  'organise',
  'summarise',
  'recognise',
  'behaviour',
  'colour',
  'centre',
] as const

/**
 * The three closed sets the audit measures, owned here rather than harvested
 * from the standards stating them.
 *
 * Parsing the prose was the alternative and it put a parser contract on two
 * documents authored for people, which the prose standard had to carry a
 * paragraph of its own to protect. The sets are a prior an author already
 * knows rather than a filter: measured at `60fc97bf` on 2026-08-19, these 21
 * terms ran across 483 markdown files for a clean exit, and every one of the
 * 70 occurrences of a banned word sat inside the ban list itself or inside an
 * example demonstrating the ban.
 *
 * The set is closed rather than extensible. Enumeration cannot close the gap
 * it aims at, and each addition costs a false-positive class, since `just`,
 * `allows`, and `very` have honest uses no literal match separates. A project
 * wanting its own vocabulary is asking for a different feature than this one.
 */
export const BAN_SETS: BanSets = {
  characters: CHARACTERS,
  words: WORDS,
  spellings: SPELLINGS,
}

/**
 * Names any set that arrived empty, so a run measuring nothing says so.
 *
 * Empty is not the same state as finding no hit. A scan with no terms reports
 * a clean file having looked for nothing, which is the silence the audit
 * refused to ship back when a standard could go missing. The sets ship with
 * the package now, so the only way one empties is an edit to this file, and
 * the guard is what keeps that edit loud rather than quiet.
 */
export function emptyBanSets(sets: BanSets = BAN_SETS): string[] {
  return (['characters', 'words', 'spellings'] as const).filter(
    (name) => sets[name].length === 0,
  )
}
