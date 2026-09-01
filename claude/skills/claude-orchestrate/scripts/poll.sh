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
STATE_DIR="$MAIN_ROOT/.canon/tmp/pr-poll"
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

# These five strings are owned elsewhere and pinned here. `claude-pr-review`
# writes `## Review` and `## Review closed`, and states the full five-heading
# set once, beside the threshold it already states once. `claude-address-review`
# writes `## Review response`, `## Rebase`, and `## Post-review findings`, the
# last for a finding a worker produces after a close-out rather than in answer
# to one already on the thread. All three surfaces ship separately, so a
# heading added in either skill breaks a test here that no check reaches across.
#
# Both families match on the first line alone so the tests stay symmetric. The
# reply family carries `## Rebase` and `## Post-review findings` beside
# `## Review response` because neither answers a comment already on the thread,
# which is why both were kept outside the `## Review` family rather than folded
# into it.
JQ_LAST_REVIEWED_HEAD='
  [ .reviews[]
    | select((.body // "") | split("\n")[0] | rtrimstr("\r")
             | . == "## Review" or . == "## Review closed")
  ] | last | .commit.oid // empty
'
# The count alone answers whether a reply is new to this script, which is not
# the same question as whether it is newer than the pass it answers. The stamp
# of the newest reply comes out of the same selection so the recency test costs
# no second filter, and it is the one this file compares against `submittedAt`.
JQ_REPLY_STATE='
  [ .comments[]
    | select((.body // "") | split("\n")[0] | rtrimstr("\r")
             | . == "## Review response" or . == "## Rebase"
             or . == "## Post-review findings")
  ] as $replies
  | ($replies | length | tostring)
    + " "
    + ([ $replies[] | .createdAt // empty | fromdateiso8601 | floor ]
       | max // 0 | tostring)
'
# A comment matching neither family above is the gap this filter exists to
# surface rather than absorb: a worker inventing a sixth heading used to reach
# this script as silence, indistinguishable from no comment at all. The count
# is read the same way the reply count is, a rising value against the baseline
# being new to this script, and the newest heading's text rides along for the
# report. It carries its spaces intact rather than encoded, since it is the
# last field on both sides of the pipe: `${unmatched_state#* }` below strips
# only the first space, and `read -r` further down hands its last named
# variable the rest of the line whole. Neither reads a heading's own spaces
# as a field separator, so a heading round-trips verbatim into the report a
# person reads when deciding whether to answer it by hand.
JQ_UNMATCHED_STATE='
  [ .comments[]
    | (.body // "") | split("\n")[0] | rtrimstr("\r")
    | select(startswith("## "))
    | select(. != "## Review" and . != "## Review closed"
              and . != "## Review response" and . != "## Rebase"
              and . != "## Post-review findings")
  ] as $unclassified
  | ($unclassified | length | tostring)
    + " "
    + (($unclassified | last) // "none")
'

# `claude-pr-review` states the threshold and posts `## Review` exactly when a
# pass carries a finding, so the heading of the last review is what says whether
# any work is owed on it. Taking it as well as the commit is what separates a
# thread waiting on a worker from one nothing is owed on. A project editing the
# two filters above for its own headings edits this one with them.
#
# The age of that review comes out of the same selection, because the heading
# alone cannot separate the two. Under the rule above an open heading means a
# dispatch was owed and made, so the ordinary healthy thread is a worker still
# working and every one of them would be reported minutes after the pass posted.
# jq computes the elapsed seconds itself, since `date -d` is GNU-only and this
# script runs wherever the plugin is installed. A review carrying no stamp reads
# as age zero and classifies nothing, which is the same answer the carry-forward
# path gives a pull request this run could not read.
#
# The stamp itself is emitted as a third field beside the age it was derived
# from, because the reply test below compares against the instant rather than
# against the elapsed seconds. A missing stamp reads as zero there too, where it
# sends a reply to be reported rather than suppressed. The two readers therefore
# fail in opposite directions on the same absent field, since zero silences the
# age test above and zero is the value the reply test reports on.
JQ_LAST_REVIEW_STATE='
  [ .reviews[]
    | select((.body // "") | split("\n")[0] | rtrimstr("\r")
             | . == "## Review" or . == "## Review closed")
  ] | last
  | if . == null then "none 0 0"
    else (if .submittedAt == null then 0
          else (.submittedAt | fromdateiso8601 | floor)
          end) as $at
      | ((.body | split("\n")[0] | rtrimstr("\r")
          | if . == "## Review" then "open" else "closed" end)
         + " "
         + (if $at == 0 then "0" else (((now | floor) - $at) | tostring) end)
         + " "
         + ($at | tostring))
    end
'

# An open pass this old has nobody on it. The cycle it has to clear is a review
# landing and a worker pushing a follow-up, measured between ten and thirty
# minutes across a day of runs on 2026-08-14, so two hours sits about four times
# past the slowest observed and still well inside a working session. Shorter
# starts catching the slow healthy case this threshold exists to exclude, and
# longer lets a dead dispatch sit past the point a person would have noticed.
# A project whose workers run longer than that raises it here.
STALE_AFTER=7200

# A pull request this run could not read keeps the line it had, so the GONE
# sweep below does not read the gap as a merge and the baseline does not lose
# the head it already knew. Saying so on stderr is the point: a silent skip is
# how the failure this script was fixed for went unnoticed for a session.
carry_forward() {
  local n=$1 reason=$2 old
  old=$(grep "^$n " "$STATE" || true)
  if [ -n "$old" ]; then
    # Every other classification compares a field against itself on a carried
    # line, so it fires nothing. That is also what keeps the two stamps unread
    # here: the baseline never held them, so both arrive empty, and the count
    # test in front of them fails before either reaches a numeric comparison.
    # STALLED reads a heading that is carried too, so
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
  local numbers n payload head prior resp merges review_state
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
    # Split here rather than carried whole, because the count keeps the fourth
    # column every baseline written so far already reads, and the stamp goes to
    # the end of the line beside the pass stamp it is compared against.
    reply_state=$(jq -r "$JQ_REPLY_STATE" <<<"$payload")
    resp=${reply_state%% *}
    reply_at=${reply_state##* }
    # Three space-separated fields, so the line below carries them as its own
    # sixth, seventh, and eighth rather than needing a split.
    review_state=$(jq -r "$JQ_LAST_REVIEW_STATE" <<<"$payload")
    # Split the same way as the reply state, carried as the line's tenth and
    # eleventh fields.
    unmatched_state=$(jq -r "$JQ_UNMATCHED_STATE" <<<"$payload")
    unmatched_count=${unmatched_state%% *}
    unmatched_heading=${unmatched_state#* }

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

    echo "$n $head ${prior:-none} $resp $merges $review_state $reply_at $unmatched_count $unmatched_heading"
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

while read -r n head prior resp merges heading age pass_at reply_at unmatched_count unmatched_heading; do
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
    FINAL+="$n $head $prior $resp $merges $state $unmatched_count"$'\n'
    continue
  fi
  old_head=$(echo "$old" | cut -d' ' -f2)
  old_resp=$(echo "$old" | cut -d' ' -f4)
  old_merges=$(echo "$old" | cut -d' ' -f5)
  # Only the marker is read off this field, so a baseline written before it
  # existed yields empty and reads as not yet reported, which is what it is. The
  # age decides the rest, so the first run after an upgrade needs no history and
  # classifies a thread already past the threshold rather than waiting a run.
  old_heading=$(echo "$old" | cut -d' ' -f6)
  old_unmatched=$(echo "$old" | cut -d' ' -f7)

  # A conflict arrives from the base moving, not from the branch, so it is
  # reported on the transition rather than only when the head changes.
  if [ "$merges" = conflict ] && [ "$old_merges" != conflict ]; then
    echo "CONFLICT  #$n no longer merges into $BASE_BRANCH"
    CHANGED=1
  fi

  # A rising count is what is new to this script, the same test RESPONSE
  # below runs against the reply family. It fires on a tracked pull request
  # only: a first sighting reports SEEN or OPENED and takes whatever count
  # already sits on the thread as its starting baseline rather than flagging
  # history retroactively. A carried line supplies neither, since
  # carry_forward re-echoes the shorter baseline shape rather than a full
  # snapshot line, so both sides default to zero the way old_unmatched
  # already does.
  if [ "${unmatched_count:-0}" -gt "${old_unmatched:-0}" ]; then
    echo "UNMATCHED #$n posted under '$unmatched_heading'"
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
  elif [ "$resp" -gt "$old_resp" ] &&
    { [ "$pass_at" = 0 ] || [ "$reply_at" -gt "$pass_at" ]; }; then
    # The count says the reply is new to this script and the stamp says it is
    # newer than the pass, and both are needed. A worker answers a finding and
    # the reviewing session closes out seconds later, so the count alone reports
    # an answered thread on the next run and the session spends a turn learning
    # `claude-pr-review` will refuse it. The gaps observed were 96, 24, and 35
    # seconds, which is a reviewing session reading a reply and posting, so this
    # is the ordinary handback rather than a race.
    #
    # A pull request carrying no pass at all reads as stamp zero and reports,
    # which is the case the count was the right test for: a reply with nothing
    # behind it is a worker talking to nobody and worth the turn. The test is
    # strictly greater to match the guard `claude-pr-review` states on the same
    # two fields, which drops a reply landing inside the same second as the
    # pass, a narrower failure than the one it removes.
    #
    # The gate sits in the condition rather than in the body so a suppressed
    # reply falls through to STALLED below, which is a thread this run should
    # still be able to reach.
    echo "RESPONSE  #$n answered with no new commit"
    CHANGED=1
  elif [ "$heading" = open ] && [ "$old_heading" != reported ] &&
    [ "$prior" = "$head" ] && [ "$age" -ge "$STALE_AFTER" ]; then
    # Three things at once: the last pass is open, it covers the head so no
    # commit followed it, and the two branches above found no reply either. The
    # open heading is posted exactly when a dispatch is owed, per the threshold
    # `claude-pr-review` states, so a pass owing one left it here at any grade
    # it carried. Any two of these describe an ordinary review waiting on a
    # worker, which is why the age carries the third: without it every
    # dispatched worker is reported minutes into the work it was sent to do,
    # and a signal firing on the healthy path is one an operator learns to
    # skip. The report still asks for a confirmation rather than asserting.
    echo "STALLED   #$n open at ${head:0:7}, no commit or reply in $((age / 3600))h"
    state=reported
    CHANGED=1
  elif [ "$heading" = open ] && [ "$old_heading" = reported ]; then
    # Nothing above fired, so the thread has not moved since it was reported.
    # Carry the marker rather than the freshly derived heading, or the state
    # re-enters next run and STALLED oscillates instead of reporting once.
    state=reported
  fi
  FINAL+="$n $head $prior $resp $merges $state $unmatched_count"$'\n'
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
