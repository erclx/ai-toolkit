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

# The audit verb is the only parse of the ban rules, so the hook an author meets
# at edit time and the stage that fails the push read one set. The awk this
# replaces parsed the word bans out of prose.md, hardcoded the em-dash and
# semicolon, and reached none of the spellings, so a British spelling passed
# here and failed the push with nothing in between explaining the difference.
#
# A missing binary degrades to no enforcement rather than a blocked edit, which
# is the behavior this hook already carried for a missing standard.
command -v aitk >/dev/null 2>&1 || exit 0

# The verb resolves the standards under its own cwd, so the project root is
# named rather than inherited. The payload carries an absolute file path, which
# is what lets the subshell move without taking the argument out of reach.
record=$(cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null && aitk markdown audit "$file" --json 2>/dev/null) || true

# The record decides rather than the exit code, so a binary predating the gate
# reports its findings here all the same. A refusal and an unparseable payload
# both yield nothing, which is the same silence a clean file produces.
hits=$(printf '%s' "$record" |
  jq -r '.entries[]?.bans[]? | ":\(.line):\(.column + 1)  \(.kind)  \(.term)"' 2>/dev/null)

[ -z "$hits" ] && exit 0

msg=$(printf 'Standards-audit: prose.md and markdown.md violations in %s. Rewrite the sentence (do not lazy-swap). A code span is the answer only where the token is genuinely an identifier under discussion.\n%s' "$file" "$hits")

jq -nc --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
