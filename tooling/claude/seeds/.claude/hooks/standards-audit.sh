#!/usr/bin/env bash

# Claude Code sends a payload and closes stdin. A bare read with nothing feeding
# it blocks forever and holds the session open, so the read is bounded. `read`
# rather than `timeout cat`, which macOS does not ship.
IFS= read -r -d '' -t 2 input
[ -n "$input" ] || {
  printf '%s reads a Claude Code hook payload on stdin and cannot be run by hand.\n' "${0##*/}" >&2
  exit 1
}

file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

file="${file//\\//}"

case "$file" in
*.md) ;;
*) exit 0 ;;
esac

case "$file" in
*.claude/.tmp/* | *.claude/memory/* | *.claude/review/* | *.claude/plans/*) exit 0 ;;
esac

[ -f "$file" ] || exit 0

# Read the closed-set word bans from the standard so the hook never carries a
# second copy. Every "Do not use ... (`a`, `b`)" bullet contributes its
# single-word backticked terms, which skips the multi-word and punctuation bans.
#
# The word bans sit in prose.md and the em-dash and semicolon bans in
# markdown.md, so this parses the first and hardcodes the second. A "Do not use"
# bullet added to markdown.md is parsed by nothing and enforces silently.
standard="${CLAUDE_PROJECT_DIR:-.}/.claude/standards/prose.md"
words=""
if [ -f "$standard" ]; then
  words=$(grep '^- Do not use ' "$standard" |
    grep -o '`[^`]*`' |
    tr -d '`' |
    grep -x '[a-z][a-z]*' |
    sort -u |
    paste -sd '|' -)
fi

hits=$(awk -v words="$words" '
  BEGIN { if (words != "") banned = "(^|[^a-z])(" words ")([^a-z]|$)" }
  /^```/ { in_code = !in_code; next }
  in_code { next }
  /—/ { print NR ": em-dash: " $0 }
  /;/  { print NR ": semicolon: " $0 }
  banned != "" {
    prose = tolower($0)
    gsub(/`[^`]*`/, "", prose)
    found = ""
    delete seen
    while (match(prose, banned)) {
      word = substr(prose, RSTART, RLENGTH)
      gsub(/[^a-z]/, "", word)
      if (word != "" && !(word in seen)) {
        seen[word] = 1
        found = found (found == "" ? "" : ", ") word
      }
      prose = substr(prose, RSTART + RLENGTH)
    }
    if (found != "") print NR ": banned word (" found "): " $0
  }
' "$file")

[ -z "$hits" ] && exit 0

msg=$(printf 'Standards-audit: prose.md and markdown.md violations in %s. Rewrite or restructure (do not lazy-swap).\n%s' "$file" "$hits")

jq -nc --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
