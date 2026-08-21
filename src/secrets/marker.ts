/**
 * The inline token exempting one line from the secret scan.
 *
 * Shaped on the `stub: true` precedent in `src/seed-marker.ts`, which answers
 * a check whose own comment records a false-positive class. The exemption
 * travels with the line it exempts rather than sitting in a path list away
 * from it, so a reader meeting a muted match finds the reason on the spot.
 *
 * The set of files carrying one is empty today. What empties it is the keying
 * rather than this mechanism: `patterns.ts` matches issued values and never
 * the words around them, so nothing in the shipped tree matches on purpose.
 * A path allow-list was declined for the same reason, since the noise it would
 * target is word-keyed and spread past the fixture trees, so it would hide
 * part of the noise and none of the risk.
 */
export const SECRET_MARKER = 'aitk-allow-secret'

/**
 * Only a marker naming a reason counts.
 *
 * A bare token is read as a line that meant to say something and did not,
 * which is the rule `isStubSeed` already applies to a field set to anything
 * but `true`. Honoring it would let a typo mute a finding, and the reason is
 * the whole value of an exemption a later reader has to weigh.
 */
const MARKER_LINE = new RegExp(`${SECRET_MARKER}:[ \\t]*\\S`)

/**
 * Whether the line at `index` is exempt, reading itself and the line above it.
 *
 * Two lines rather than one, because a credential-shaped literal is as often
 * introduced by a preceding comment as annotated inline, and a format that
 * takes no trailing comment at all has nowhere else to put the marker. Nothing
 * further up counts, so a marker cannot silence a block it does not sit on.
 */
export function isExempt(lines: readonly string[], index: number): boolean {
  const own = lines[index]
  const above = index > 0 ? lines[index - 1] : undefined

  return (
    (own !== undefined && MARKER_LINE.test(own)) ||
    (above !== undefined && MARKER_LINE.test(above))
  )
}
