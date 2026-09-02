import { type ChecksState, type RawCheck, rollup } from '@/targets/pulls'

/** One row of `repos/{owner}/{repo}/commits/<sha>/check-runs`. */
export interface RawCheckRun {
  readonly head_sha?: string
  readonly status?: string
  readonly conclusion?: string | null
}

/** What that endpoint returns, count and rows apart. */
export interface CheckRunListing {
  readonly total_count?: number
  readonly check_runs?: readonly RawCheckRun[]
}

export interface ChecksReading {
  readonly state: ChecksState
  /** The commit the answer describes. */
  readonly tip: string
  /** Runs the listing carried for the tip. */
  readonly matched: number
  /** Runs the listing carried for some other commit. */
  readonly foreign: number
  /** What the endpoint said it holds, which can exceed the rows it returned. */
  readonly reported: number
}

/**
 * Puts a check-run row into the shape `rollup` reads.
 *
 * REST spells its statuses lowercase and `rollup` reads the GraphQL enum the
 * pull request listing returns, so the vocabulary is converted at this boundary
 * rather than teaching that function a second one. A null conclusion becomes an
 * absent one, since `rollup` reads absence as a run that has not concluded.
 */
function adapt(run: RawCheckRun): RawCheck {
  return {
    ...(run.status !== undefined && { status: run.status.toUpperCase() }),
    ...(run.conclusion !== undefined &&
      run.conclusion !== null && {
        conclusion: run.conclusion.toUpperCase(),
      }),
  }
}

/**
 * Collapses a check-run listing to one word about one commit.
 *
 * Keying the query on a sha is necessary and not sufficient. The endpoint
 * returned `total_count` 2 with an empty row list during a measured window on
 * 2026-09-02, so a reader that finds no run for the tip and reports `passing`
 * reproduces the false green behind a better query. Both that case and a
 * listing carrying a run for another commit report `pending` instead.
 *
 * The foreign test runs ahead of the collapse rather than after it. A listing
 * that describes another commit says nothing about this one, so answering off
 * the matching half would report a verdict on a set known to be incomplete.
 */
export function collapseChecks(
  tip: string,
  listing: CheckRunListing,
): ChecksReading {
  const runs = listing.check_runs ?? []
  const matched = runs.filter((run) => run.head_sha === tip)
  const reading = {
    tip,
    matched: matched.length,
    foreign: runs.length - matched.length,
    reported: listing.total_count ?? runs.length,
  }

  if (reading.foreign > 0) return { ...reading, state: 'pending' }

  // A count above the rows returned is a listing this reader holds only part
  // of, whether the endpoint paged or answered inconsistently. Collapsing the
  // part in hand would report `passing` off a set a failing run can still be
  // sitting outside of, which is the false green keyed on a sha alone.
  if (reading.reported > runs.length) return { ...reading, state: 'pending' }

  if (matched.length === 0) return { ...reading, state: 'pending' }

  return { ...reading, state: rollup(matched.map(adapt)) ?? 'pending' }
}
