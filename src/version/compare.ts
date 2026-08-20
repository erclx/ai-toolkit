/**
 * A `major.minor.patch` core with an optional prerelease tail. The registry
 * publishes both shapes under the same dist tag, so a comparison that only
 * understood the core would read `1.0.0-rc.1` as unparseable and report the
 * whole lookup as unknown.
 */
const VERSION =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/

export interface ParsedVersion {
  readonly major: number
  readonly minor: number
  readonly patch: number
  /** Absent on a release, which sorts above every prerelease of the same core. */
  readonly prerelease?: string
}

export function parseVersion(raw: string): ParsedVersion | undefined {
  const match = VERSION.exec(raw.trim())
  if (match === null) return undefined

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    ...(match[4] === undefined ? {} : { prerelease: match[4] }),
  }
}

/**
 * Negative when `left` is older, positive when it is newer, zero when the two
 * name the same version.
 *
 * Prerelease identifiers compare as whole strings rather than dot segment by
 * dot segment, which is narrower than semver states. Every version this repo
 * publishes is a plain core, so the ordering inside a prerelease series decides
 * nothing here, and the one comparison that matters is that any prerelease
 * sorts below the release sharing its core.
 */
export function compareVersions(
  left: ParsedVersion,
  right: ParsedVersion,
): number {
  if (left.major !== right.major) return left.major - right.major
  if (left.minor !== right.minor) return left.minor - right.minor
  if (left.patch !== right.patch) return left.patch - right.patch

  if (left.prerelease === right.prerelease) return 0
  if (left.prerelease === undefined) return 1
  if (right.prerelease === undefined) return -1

  return left.prerelease < right.prerelease ? -1 : 1
}
