#!/usr/bin/env bash
# Reports worker and pull request transitions as they happen. Reads only.
#
# The poll answers "what moved since the last run" on a schedule the session
# holds. This answers "what just changed" on a loop of its own, and it exists
# because the two readings a dispatch needs are not one reading: a worker that
# finishes goes idle and a worker that crashes vanishes, so a watch matching
# only the pull request list stays silent through the second.
#
# `set -e` is deliberately not set. This runs for hours, and one transient `gh`
# failure aborting the loop is a silent stop rather than a reported one. Every
# read below states its own failure instead.
set -uo pipefail

# Seconds between passes. A pass costs two cheap reads and the transitions it
# watches take minutes, so the number trades staleness against little. Raise it
# in a project whose workers run long.
INTERVAL=60

# Resolving the main worktree root rather than this file's folder keeps a watch
# started from a linked worktree reading the same repository as one started from
# main. The repository field on a roster row is that root's `.git`.
MAIN_ROOT="$(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2; exit}')"
if [ -z "$MAIN_ROOT" ]; then
  echo "watch: not a git repository, so nothing is watched" >&2
  exit 1
fi
REPOSITORY="$MAIN_ROOT/.git"

# The base branch is read rather than assumed, since this ships to projects that
# do not all call it `main`. It is what separates a worker from the controlling
# session, which sits on the base branch in the main worktree.
BASE_REF="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
if [ -z "$BASE_REF" ]; then
  BASE_REF="origin/$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name 2>/dev/null || echo main)"
fi
BASE_BRANCH="${BASE_REF#origin/}"

# Every session in this repository holding a branch other than the base one is a
# worker, whoever launched it. The prototype matched the `orchestrator-` prefix
# instead, which reads a dispatched worker and misses every hand-launched one,
# and those are the ordinary shape whenever the operator is launching.
read_workers() {
  aitk sessions list --json 2>/dev/null | tail -1 | jq -r \
    --arg repository "$REPOSITORY" --arg base "$BASE_BRANCH" '
      .sessions[]?
      | select(.repository == $repository)
      | select(.branch != null and .branch != $base)
      | "\(.name) \(.branch) \(.status)"
    ' 2>/dev/null | sort
}

read_pulls() {
  gh pr list --state open --json number,headRefName,title --jq \
    '.[] | "PR-OPEN #\(.number) \(.headRefName) \(.title)"' 2>/dev/null | sort
}

# A failed read is reported and the previous baseline kept. Reading an empty
# result as the current state would report every worker gone and every pull
# request new on the pass after, which is the one failure that makes a detection
# tool worth less than no tool.
#
# The two sources carry a baseline flag apiece rather than sharing one. A read
# that fails on the first pass leaves its baseline empty while the other source
# establishes one, and a single flag would then report that source's whole list
# as new on the pass after it recovers.
prev_pulls=""
prev_workers=""
prev_names=""
pulls_seen=0
workers_seen=0

while true; do
  pulls="$(read_pulls)"
  pulls_read=$?
  workers="$(read_workers)"
  workers_read=$?

  if [ "$pulls_read" -ne 0 ]; then
    echo "watch: the open pull request list failed to load, so none is classified this pass"
  fi
  if [ "$workers_read" -ne 0 ]; then
    echo "watch: the session roster failed to load, so no worker is classified this pass"
  fi

  names="$(printf '%s\n' "$workers" | awk 'NF {print $1}' | sort -u)"

  if [ "$pulls_seen" -eq 1 ] && [ "$pulls_read" -eq 0 ]; then
    comm -13 <(printf '%s\n' "$prev_pulls") <(printf '%s\n' "$pulls") | grep . || true
  fi

  if [ "$workers_seen" -eq 1 ] && [ "$workers_read" -eq 0 ]; then
    comm -13 <(printf '%s\n' "$prev_workers") <(printf '%s\n' "$workers") |
      grep . | sed 's/^/WORKER /' || true
    comm -23 <(printf '%s\n' "$prev_names") <(printf '%s\n' "$names") |
      grep . | sed 's/^/WORKER-GONE /' || true
  fi

  if [ "$pulls_read" -eq 0 ]; then
    prev_pulls="$pulls"
    pulls_seen=1
  fi
  if [ "$workers_read" -eq 0 ]; then
    prev_workers="$workers"
    prev_names="$names"
    workers_seen=1
  fi

  sleep "$INTERVAL"
done
