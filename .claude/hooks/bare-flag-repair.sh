#!/usr/bin/env bash

# canon-no-seed: calls scripts/lib/worktree.sh, toolkit-internal and never shipped, so seeding this alone ships a permanent no-op. It already no-ops safely where the library is absent.

# Claude Code's worktree entry writes core.bare into the shared config and its
# exit never restores it, so every later git command fails. verify.sh runs the
# same repair, but a session that only reads git never runs the suite, so the
# tool call is the trigger that fires while the session is still working.

# Draining stdin with the builtin keeps the flag read the only process on the
# path that every invocation but a handful takes.
IFS= read -r -d '' input

root="${CLAUDE_PROJECT_DIR:-.}"
[ "$(git -C "$root" config --get core.bare 2>/dev/null || echo false)" = true ] || exit 0

case "$(printf '%s' "$input" | jq -r '.tool_name // empty')" in
Bash) ;;
*) exit 0 ;;
esac

lib="$root/scripts/lib/worktree.sh"
[ -f "$lib" ] || exit 0

# stdout carries the hook protocol, so the library's warning is captured and
# re-emitted as additionalContext rather than printed where it would corrupt it.
warning=""
log_warn() { warning="$1"; }
# shellcheck source=/dev/null
source "$lib"
repair_bare_flag "$root"

[ -n "$warning" ] || exit 0
jq -nc --arg msg "$warning" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$msg}}'
