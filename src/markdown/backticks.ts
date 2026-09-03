/** One code span, paired by matching backtick-run length rather than count. */
export interface BacktickSpan {
  /** Index of the opening run's first backtick. */
  readonly start: number
  /** Index one past the closing run's last backtick. */
  readonly end: number
  /** The text between the two runs, delimiters excluded. */
  readonly content: string
}

/**
 * Every code span in a bullet, pairing a run of backticks only with the next
 * run of the same length.
 *
 * A single-backtick regex reads a doubled delimiter, such as
 * ``` ``git status`` ```, as two unrelated single backticks: it opens on the
 * second backtick of the pair, closes on the first backtick of the closing
 * pair, and leaves one backtick before and after the span unconsumed. Every
 * scan after that treats a stray leftover backtick as an opener, which
 * absorbs the next real span's opening delimiter as its closer and drops the
 * path inside past it. Pairing by run length rather than by single backtick
 * keeps a doubled delimiter closed by a doubled delimiter, so nothing after
 * it loses its pairing.
 *
 * An opening run with no same-length run after it is not a delimiter, per
 * CommonMark, so it is left as literal text and the scan resumes at the next
 * run rather than backtracking into the unmatched one.
 */
export function findBacktickSpans(text: string): BacktickSpan[] {
  const runs = [...text.matchAll(/`+/g)].map((match) => ({
    start: match.index ?? 0,
    length: match[0].length,
  }))

  const spans: BacktickSpan[] = []
  let i = 0
  while (i < runs.length) {
    const open = runs[i]
    const closeIndex = runs.findIndex(
      (run, index) => index > i && run.length === open.length,
    )
    if (closeIndex === -1) {
      i += 1
      continue
    }
    const close = runs[closeIndex]
    spans.push({
      start: open.start,
      end: close.start + close.length,
      content: text.slice(open.start + open.length, close.start),
    })
    i = closeIndex + 1
  }

  return spans
}
