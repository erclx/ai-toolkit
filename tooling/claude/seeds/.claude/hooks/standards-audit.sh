#!/usr/bin/env bash
#
# PostToolUse hook. Greps markdown files for em-dashes and semicolons,
# both banned in standards/prose.md. Emits additionalContext on hits so
# the agent self-corrects on the next turn. Fenced code blocks are
# excluded to avoid false positives on `;` in code samples.

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

case "$file" in
*.md) ;;
*) exit 0 ;;
esac

case "$file" in
*.claude/.tmp/* | *.claude/memory/* | *.claude/review/* | *.claude/plans/*) exit 0 ;;
esac

[ -f "$file" ] || exit 0

hits=$(awk '
  /^```/ { in_code = !in_code; next }
  in_code { next }
  /—/ { print NR ": em-dash: " $0 }
  /;/  { print NR ": semicolon: " $0 }
' "$file")

[ -z "$hits" ] && exit 0

msg=$(printf 'Standards-audit: prose.md violations in %s. Rewrite or restructure (do not lazy-swap).\n%s' "$file" "$hits")

jq -nc --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
