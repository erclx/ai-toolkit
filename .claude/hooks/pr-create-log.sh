#!/usr/bin/env bash

# Reminds a worker session of the pull-request announcement it owes and logs
# the creation as a denominator for the miss rate `claude-worker` cannot
# measure on its own. Follows path-form.sh's precedent: a PostToolUse hook
# returning hookSpecificOutput.additionalContext is the shipped route back
# into a session's own turn.
#
# The hook cannot know whether the announcement went out, only that a pull
# request now exists to announce. It states the obligation and counts the
# creation, and claims nothing about the send.

# Claude Code sends a payload and closes stdin. A bare read with nothing
# feeding it blocks forever and holds the session open, so the read is
# bounded. `read` rather than `timeout cat`, which macOS does not ship.
IFS= read -r -d '' -t 2 input
[ -n "$input" ] || {
  printf '%s reads a Claude Code hook payload on stdin and cannot be run by hand.\n' "${0##*/}" >&2
  exit 1
}

command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
case "$command" in
*"gh pr create"*) ;;
*) exit 0 ;;
esac

# gh pr create prints the new pull request's URL to stdout on success, so
# matching it is what tells a creation apart from a failed or refused call.
stdout=$(printf '%s' "$input" | jq -r '.tool_response.stdout // empty')
url=$(printf '%s' "$stdout" | grep -Eo 'https://github\.com/[^[:space:]]+/pull/[0-9]+' | tail -1)
[ -n "$url" ] || exit 0

root="${CLAUDE_PROJECT_DIR:-.}"
log_dir="$root/.claude/.tmp/pr-create-log"
mkdir -p "$log_dir"
session=$(printf '%s' "$input" | jq -r '.session_id // "unknown"')
printf -- '- %s session=%s pr=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$session" "$url" >>"$log_dir/log.md"

msg="Pull request $url just opened. If this session holds a worker's channel obligation, announce it to the controller now, per claude-worker."
jq -nc --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
