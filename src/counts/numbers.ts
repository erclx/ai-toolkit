const ONES: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
}

const TEENS: Record<string, number> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
}

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

/**
 * Every spelled-out cardinal from zero through ninety-nine, keyed lowercase.
 *
 * Every catalog this reads is under a hundred members, so the compound tens
 * form (`sixty-one`) is the only multi-word shape worth building: the corpus
 * this was written against spells a catalog size in words as often as in
 * digits, and a matcher reading digits alone would miss half its own
 * motivating cases.
 */
export const WORD_NUMBERS: ReadonlyMap<string, number> = (() => {
  const words = new Map<string, number>()
  for (const [word, value] of Object.entries(ONES)) words.set(word, value)
  for (const [word, value] of Object.entries(TEENS)) words.set(word, value)
  for (const [tensWord, tensValue] of Object.entries(TENS)) {
    words.set(tensWord, tensValue)
    for (const [onesWord, onesValue] of Object.entries(ONES)) {
      if (onesValue === 0) continue
      words.set(`${tensWord}-${onesWord}`, tensValue + onesValue)
    }
  }
  return words
})()

/**
 * Longest key first, so the alternation matches `sixty-one` whole rather than
 * stopping at `sixty` and leaving `-one` unconsumed.
 */
const WORD_ALTERNATION = [...WORD_NUMBERS.keys()]
  .sort((left, right) => right.length - left.length)
  .join('|')

/** A bare digit run, capped at three since every catalog here is under 1,000. */
const DIGIT_PATTERN = '\\d{1,3}'

/** Either spelling a catalog size takes in this corpus, for a caller building its own regex around it. */
export const NUMBER_PATTERN = `(?:${DIGIT_PATTERN}|${WORD_ALTERNATION})`

/** The value a matched token names, or `undefined` for a word this map does not carry. */
export function parseNumber(token: string): number | undefined {
  if (/^\d+$/.test(token)) return Number(token)
  return WORD_NUMBERS.get(token.toLowerCase())
}
