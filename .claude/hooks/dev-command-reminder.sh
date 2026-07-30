#!/usr/bin/env bash

input=$(cat)

# Matching inside jq keeps the whole payload to one process on the hot path, and
# preserves a multi-line command that @tsv would escape past the anchor.
session=$(printf '%s' "$input" | jq -r '
  if .tool_name != "Bash" then "SKIP"
  elif ((.tool_input.command // "") | test("(bun|npm|pnpm|yarn) run (check:install|check|format)([[:space:]]|$)")) then (.session_id // "")
  else "SKIP" end')

[ "$session" = "SKIP" ] && exit 0
[ -n "$session" ] || exit 0

entry=".claude/context/development.md"
[ -f "${CLAUDE_PROJECT_DIR:-.}/$entry" ] || exit 0

key=$(printf '%s' "$session" | tr -c 'A-Za-z0-9' '_')
marker_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/.tmp/dev-command-reminder"
marker="$marker_dir/$key"
[ -f "$marker" ] && exit 0
mkdir -p "$marker_dir"
: >"$marker"

msg=$(printf 'Dev commands have gotchas documented at %s. Read it before interpreting this run, it covers the script and hook reference.' "$entry")
jq -nc --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$msg}}'
