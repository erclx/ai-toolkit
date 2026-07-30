#!/usr/bin/env bash

input=$(cat)

tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
[ "$tool" = "Bash" ] || exit 0

command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
[ -n "$command" ] || exit 0

# Only the scripts with gotchas. A reminder on every script invocation trains the agent to ignore it.
printf '%s' "$command" | grep -qE '(bun|npm|pnpm|yarn) run (check:install|check|format)([[:space:]]|$)' || exit 0

entry=".claude/context/development.md"
[ -f "${CLAUDE_PROJECT_DIR:-.}/$entry" ] || exit 0

session=$(printf '%s' "$input" | jq -r '.session_id // "none"')
key=$(printf '%s' "$session" | tr -c 'A-Za-z0-9' '_')
marker_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/.tmp/dev-command-reminder"
marker="$marker_dir/$key"
[ -f "$marker" ] && exit 0
mkdir -p "$marker_dir"
: >"$marker"

msg=$(printf 'Dev commands have gotchas documented at %s. Read it before interpreting this run, it covers the script and hook reference.' "$entry")
jq -nc --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$msg}}'
