/**
 * The two version namespaces `standards/versioning.md` keeps apart, and why a
 * pull request cannot be sorted between them by pattern alone.
 *
 * A phase label (`v68.5`) and a semver reference (`v3.44`) both match
 * `v<digits>(.<digits>){1,2}`, so a shape-only scan cannot tell them apart. The
 * first measurement of this defect tried exactly that and returned 28 of 60
 * correct. What separates the two is not the token but the pull request: a
 * release-please pull request legitimately carries version numbers in its
 * generated body, and every other pull request does not.
 */
export interface PhaseScanInput {
  readonly title: string
  readonly body: string
  readonly headRefName: string
}

export interface PhaseScanResult {
  /** Whether this pull request is release-please's own, per its fixed shape. */
  readonly cutsRelease: boolean
  readonly phaseLabels: readonly string[]
  readonly semverTags: readonly string[]
}

const VERSION_TOKEN = /\bv\d+(?:\.\d+){1,2}\b/g

/**
 * The head branch release-please opens every release pull request under.
 *
 * `release-please-config.json` names the package `aitk`, so the observed
 * branch is `release-please--branches--main--components--aitk`. The prefix
 * stops short of the component segment, since that segment moves with the
 * package name and the branch segment does not.
 */
const RELEASE_HEAD_PREFIX = 'release-please--branches--main'

const RELEASE_TITLE_PREFIX = 'chore(main): release '

/**
 * Two fixed signals rather than one, because either alone is a string an
 * author's own pull request could reproduce. A title starting with the
 * release commit type is plain conventional-commit text, and a head branch is
 * exactly what a PR renamed for review would want to imitate to slip a real
 * phase label past this check. Together they name release-please's own act of
 * opening the pull request, which nothing else on the remote can perform.
 */
function isReleasePullRequest(input: PhaseScanInput): boolean {
  return (
    input.headRefName.startsWith(RELEASE_HEAD_PREFIX) &&
    input.title.startsWith(RELEASE_TITLE_PREFIX)
  )
}

/**
 * Reads a title and a body for version-shaped tokens and sorts every one
 * found into the namespace this pull request is allowed to carry.
 *
 * The split runs on the pull request rather than on each token. A release
 * pull request's tokens are read as the semver references its generated body
 * legitimately carries, and every other pull request's tokens are read as
 * leaked phase labels, which is what `standards/versioning.md` names the
 * defect this exists to catch. A body quoting a label inside a fenced block
 * is not exempted: the corpus behind the plan found no genuine quoting case,
 * and an escape hatch invites the failure it would exempt.
 */
export function scanPhaseLabels(input: PhaseScanInput): PhaseScanResult {
  const text = `${input.title}\n${input.body}`
  const tokens = [...new Set(text.match(VERSION_TOKEN) ?? [])]
  const cutsRelease = isReleasePullRequest(input)

  return cutsRelease
    ? { cutsRelease, phaseLabels: [], semverTags: tokens }
    : { cutsRelease, phaseLabels: tokens, semverTags: [] }
}
