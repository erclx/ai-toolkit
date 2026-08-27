#!/usr/bin/env bash

# Claude Code sends a payload and closes stdin. A bare read with nothing feeding
# it blocks forever and holds the session open, so the read is bounded. `read`
# rather than `timeout cat`, which macOS does not ship.
IFS= read -r -d '' -t 2 input
[ -n "$input" ] || {
  printf '%s reads a Claude Code hook payload on stdin and cannot be run by hand.\n' "${0##*/}" >&2
  exit 1
}

event=$(printf '%s' "$input" | jq -r '.hook_event_name // empty')
[ "$event" = "PreCompact" ] || exit 0

# The matcher in settings.json is the documented separator between a manual and
# an automatic compaction, and no event-specific payload field is documented for
# this event. Reading `trigger` where it exists hardens a wildcard registration
# without depending on a field that may never arrive, so an absent one carries
# on and only a present `auto` stops here.
trigger=$(printf '%s' "$input" | jq -r '.trigger // empty')
[ "$trigger" = "auto" ] && exit 0

session=$(printf '%s' "$input" | jq -r '.session_id // "none"')
key=$(printf '%s' "$session" | tr -c 'A-Za-z0-9' '_')
marker_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/.tmp/precompact-handoff"
marker="$marker_dir/$key"
[ -f "$marker" ] && exit 0

# The marker is what ends the block, so a marker that cannot be written would
# refuse every compaction this session ever takes rather than only the first.
# Failing open costs one unasked handoff and failing closed strands the session,
# so a scratch directory that refuses the write carries on instead.
mkdir -p "$marker_dir" 2>/dev/null || exit 0
: >"$marker" 2>/dev/null || exit 0

# This event carries no `additionalContext` and its exit-0 output reaches the
# debug log alone, so blocking is the only channel that reaches the session at
# all. Exit 2 makes the stderr text the blocking reason, which is why the
# message goes there rather than to stdout.
cat >&2 <<'MSG'
Compaction blocked once so the handoff is written first. A compaction keeps conclusions and drops the reasoning that produced them, and this session is the only one still holding that reasoning.

Run the aitk:session-map skill, then run /compact again. This block fires once per session, so the next /compact proceeds whether or not a map was written.

Where this session holds no reasoning a reader could not get faster from git, say so and write nothing. A map padded from the tree is worse than no map, because the next session trusts it.
MSG
exit 2
