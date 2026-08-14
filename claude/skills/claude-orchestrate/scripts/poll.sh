#!/usr/bin/env bash
# Reports pull request movement since the last run. Reads only.
#
# The shebang is load-bearing. An earlier version ran under the operator's zsh,
# where an unquoted parameter expansion does not word-split, so `set -- $line`
# left every field but the first empty and every head compared unequal. The
# poll reported movement that had not happened, which is the one failure that
# makes a detection tool worth less than no tool.
set -e
set -o pipefail

# The baseline is per-machine mutable state, so it stays in gitignored scratch
# even though the script is tracked. Resolving the main worktree root rather
# than this file's own folder keeps a poll started from a linked worktree
# reading the baseline a poll started from main wrote.
MAIN_ROOT="$(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2; exit}')"
if [ -z "$MAIN_ROOT" ]; then
  echo "poll: not a git repository, so nothing is classified" >&2
  exit 1
fi
STATE_DIR="$MAIN_ROOT/.claude/.tmp/pr-poll"
mkdir -p "$STATE_DIR"
STATE="$STATE_DIR/baseline.txt"
touch "$STATE"

# The base branch is read rather than assumed, since this ships to projects that
# do not all call it `main`. A wrong base is not a visible failure: merge-tree
# reports every pull request as conflicted against a ref that does not resolve.
BASE_REF="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
if [ -z "$BASE_REF" ]; then
  BASE_REF="origin/$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name 2>/dev/null || echo main)"
fi
BASE_BRANCH="${BASE_REF#origin/}"

# These four strings are owned elsewhere and pinned here. `claude-pr-review`
# writes `## Review` and `## Review closed`, and `claude-address-review` writes
# `## Review response` and `## Rebase`. All three surfaces ship separately, so a
# heading added in either skill breaks a test here that no check reaches across.
#
# Both families match on the first line alone so the two tests stay symmetric.
# The reply family carries `## Rebase` because a run sent straight to the rebase
# step posts under a heading deliberately kept outside the `## Review` family.
# Widening one family without the other is what left the reply test narrow, so
# a fifth heading is added here beside its sibling.
JQ_LAST_REVIEWED_HEAD='
  [ .reviews[]
    | select((.body // "") | split("\n")[0] | rtrimstr("\r")
             | . == "## Review" or . == "## Review closed")
  ] | last | .commit.oid // empty
'
JQ_REPLY_COUNT='
  [ .comments[]
    | select((.body // "") | split("\n")[0] | rtrimstr("\r")
             | . == "## Review response" or . == "## Rebase")
  ] | length
'

# `claude-pr-review` posts `## Review` only for a pass carrying a critical or a
# should-fix, so the heading of the last review is what says whether anything
# blocks the merge. Taking it as well as the commit is what separates a thread
# waiting on a worker from one a pass left open owing no dispatch. A project
# editing the two filters above for its own headings edits this one with them.
JQ_LAST_REVIEW_HEADING='
  [ .reviews[]
    | select((.body // "") | split("\n")[0] | rtrimstr("\r")
             | . == "## Review" or . == "## Review closed")
    | (.body // "") | split("\n")[0] | rtrimstr("\r")
  ] | last
  | if . == "## Review" then "open" elif . == null then "none" else "closed" end
'

# A pull request this run could not read keeps the line it had, so the GONE
# sweep below does not read the gap as a merge and the baseline does not lose
# the head it already knew. Saying so on stderr is the point: a silent skip is
# how the failure this script was fixed for went unnoticed for a session.
carry_forward() {
  local n=$1 reason=$2 old
  old=$(grep "^$n " "$STATE" || true)
  if [ -n "$old" ]; then
    # Every other classification compares a field against itself on a carried
    # line, so it fires nothing. STALLED reads a heading that is carried too, so
    # the field is blanked to a value no branch matches. Echoing it intact would
    # classify a pull request this run never reached while stderr below says the
    # opposite, and one successful read restores it a run later. An already
    # reported thread keeps its marker, or an unreadable run would let the same
    # thread be reported a second time.
    echo "$old" | awk '{ if ($6 != "reported") $6 = "carried"; print }'
    echo "poll: #$n $reason, so it keeps its last known state and goes unclassified" >&2
  else
    echo "poll: #$n $reason, and it has no last known state, so it goes unclassified" >&2
  fi
}

snapshot() {
  local numbers n payload head prior resp merges heading
  git fetch -q origin "$BASE_BRANCH" 2>/dev/null || true

  # A failed list reaches the caller as no open pull requests, and that reports
  # every tracked one as GONE. It is a louder wrong answer than the one this
  # script was fixed for, so the run aborts rather than classify on it.
  if ! numbers=$(gh pr list --state open --json number --jq '.[].number' 2>/dev/null); then
    echo "poll: the open pull request list could not be read" >&2
    return 1
  fi

  for n in $numbers; do
    # A query that failed and a pull request with genuinely no reviews both
    # arrive as an empty result. Reading the first as the second reported a
    # reviewed pull request as never reviewed, which routes the re-review to
    # the first-pass branch, where it reports and stops, so the movement sits
    # unreviewed until a person notices. One query per pull request gives that
    # failure a single place to surface.
    if ! payload=$(gh pr view "$n" --json headRefOid,reviews,comments 2>/dev/null); then
      carry_forward "$n" "could not be read"
      continue
    fi

    head=$(jq -r '.headRefOid // empty' <<<"$payload")
    if [ -z "$head" ]; then
      carry_forward "$n" "returned no head"
      continue
    fi

    prior=$(jq -r "$JQ_LAST_REVIEWED_HEAD" <<<"$payload")
    resp=$(jq -r "$JQ_REPLY_COUNT" <<<"$payload")
    heading=$(jq -r "$JQ_LAST_REVIEW_HEADING" <<<"$payload")

    # `gh pr view --json mergeable` reports UNKNOWN until GitHub finishes
    # computing it, which is exactly when a poll asks. merge-tree answers
    # locally against the base this machine has, so it never returns UNKNOWN.
    git fetch -q origin "pull/$n/head" 2>/dev/null || true
    if ! git cat-file -e "${head}^{commit}" 2>/dev/null ||
      ! git rev-parse --verify -q "$BASE_REF" >/dev/null; then
      # merge-tree exits non-zero on a ref it cannot resolve as well as on a
      # real conflict, and the two are indistinguishable from its status. Both
      # sides are checked, because an unresolvable base reports every pull
      # request as conflicted rather than one, which is the louder half.
      merges=unknown
    elif git merge-tree --write-tree "$BASE_REF" "$head" >/dev/null 2>&1; then
      merges=clean
    else
      merges=conflict
    fi

    echo "$n $head ${prior:-none} $resp $merges $heading"
  done
}

# The reason is printed by whichever branch failed, since this one cannot tell
# a list query from a parse and naming either would misattribute the other.
if ! NEW=$(snapshot); then
  echo "poll: nothing is classified this run and the baseline is unchanged" >&2
  exit 1
fi
CHANGED=0
# The baseline is written from here rather than from the snapshot, because the
# heading field is the one column a classification rewrites. STALLED reports a
# standing condition rather than a transition, so without a written marker it
# would fire on every later run and the board would never read "No movement."
FINAL=""

while read -r n head prior resp merges heading; do
  [ -z "$n" ] && continue
  state=$heading
  old=$(grep "^$n " "$STATE" || true)
  if [ -z "$old" ]; then
    # A pull request first seen here may already carry a pass, when it opened
    # and was reviewed between two runs. Reporting it as new invites a first
    # pass the thread already has.
    if [ "$prior" = "$head" ]; then
      echo "SEEN      #$n at ${head:0:7}, first sighting, already covered by a pass"
    elif [ "$merges" = unknown ]; then
      # `unknown` means no merge was attempted, so it is left off the line
      # rather than printed where a verdict belongs.
      echo "OPENED    #$n at ${head:0:7}"
    else
      echo "OPENED    #$n at ${head:0:7}, $merges against $BASE_BRANCH"
    fi
    CHANGED=1
    FINAL+="$n $head $prior $resp $merges $state"$'\n'
    continue
  fi
  old_head=$(echo "$old" | cut -d' ' -f2)
  old_resp=$(echo "$old" | cut -d' ' -f4)
  old_merges=$(echo "$old" | cut -d' ' -f5)
  # A baseline written before this field existed yields empty, which matches no
  # test below, so the first run after an upgrade classifies nothing new.
  old_heading=$(echo "$old" | cut -d' ' -f6)

  # A conflict arrives from the base moving, not from the branch, so it is
  # reported on the transition rather than only when the head changes.
  if [ "$merges" = conflict ] && [ "$old_merges" != conflict ]; then
    echo "CONFLICT  #$n no longer merges into $BASE_BRANCH"
    CHANGED=1
  fi

  if [ "$head" != "$old_head" ]; then
    if [ "$prior" = "none" ]; then
      echo "MOVED     #$n -> ${head:0:7}, never reviewed"
    elif [ "$prior" = "$head" ]; then
      # An out-of-band pass reviewed this head before the poll saw it move, so
      # the range is empty because it is covered rather than because it broke.
      # Without this the force-push branch below claims a rewrite that never
      # happened, which is the class of false report the shebang note names.
      echo "SEEN      #$n -> ${head:0:7}, already covered by the last pass"
    else
      # The range needs both commits local, and a force-push leaves the prior
      # one unreachable. Count what resolves and say nothing when it does not,
      # rather than reporting a zero that reads as no new work.
      git fetch -q origin "pull/$n/head" 2>/dev/null || true
      since=$(git log --oneline "${prior}..${head}" 2>/dev/null | wc -l | tr -d ' ' || true)
      if [ -n "$since" ] && [ "$since" != "0" ]; then
        echo "MOVED     #$n -> ${head:0:7}, $since commit(s) since your last pass"
      else
        echo "MOVED     #$n -> ${head:0:7}, range unresolved, likely force-pushed"
      fi
    fi
    CHANGED=1
  elif [ "$resp" -gt "$old_resp" ]; then
    echo "RESPONSE  #$n answered with no new commit"
    CHANGED=1
  elif [ "$heading" = open ] && [ "$old_heading" = open ] && [ "$prior" = "$head" ]; then
    # Three things at once: the last pass is open, it covers the head so no
    # commit followed it, and the two branches above found no reply either. The
    # open heading is posted only for a critical or should-fix, so a pass owing
    # no dispatch left it here. Any two of these describe an ordinary review
    # waiting on a worker, which is also what a worker slower than one interval
    # looks like, so the report asks for a confirmation rather than asserting.
    echo "STALLED   #$n open at ${head:0:7}, no commit or reply since the last pass"
    state=reported
    CHANGED=1
  elif [ "$heading" = open ] && [ "$old_heading" = reported ]; then
    # Nothing above fired, so the thread has not moved since it was reported.
    # Carry the marker rather than the freshly derived heading, or the state
    # re-enters next run and STALLED oscillates instead of reporting once.
    state=reported
  fi
  FINAL+="$n $head $prior $resp $merges $state"$'\n'
done <<<"$NEW"

while read -r n _rest; do
  [ -z "$n" ] && continue
  echo "$NEW" | grep -q "^$n " || {
    echo "GONE      #$n merged or closed"
    CHANGED=1
  }
done <"$STATE"

[ "$CHANGED" -eq 0 ] && echo "No movement."
printf '%s' "$FINAL" >"$STATE"
