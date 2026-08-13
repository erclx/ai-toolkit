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
# The verb resolves the standards under its own cwd, so the project root is
# named rather than inherited. The payload carries an absolute file path, which
# is what lets the runner move without taking the argument out of reach.
root="${CLAUDE_PROJECT_DIR:-.}"

# A checkout carrying the CLI source runs that source, so this hook and the
# push stage read one build. A globally installed binary lags a branch by
# whatever has not been released, which puts a ban kind added in
# `src/markdown/bans.ts` into the push and not into the edit.
# `scripts/core/verify.sh` names the same reason for the same choice.
#
# A tree without the source falls back to the binary. A machine with neither
# reports that nothing ran rather than exiting clean, since an edit nobody
# checked and an edit carrying no violation are the same silence to a reader.
unread=""
if [ -f "$root/src/cli.ts" ] && command -v bun >/dev/null 2>&1; then
  record=$(cd "$root" 2>/dev/null && bun src/cli.ts markdown audit "$file" --json 2>/dev/null) || true
elif command -v aitk >/dev/null 2>&1; then
  record=$(cd "$root" 2>/dev/null && aitk markdown audit "$file" --json 2>/dev/null) || true
else
  unread="runner"
fi

# The record decides rather than the exit code, so a binary predating the gate
# reports its findings here all the same. A refusal and an unparseable payload
# both yield nothing, which is the same silence a clean file produces.
hits=$(printf '%s' "$record" |
  jq -r '.entries[]?.bans[]? | ":\(.line):\(.column + 1)  \(.kind)  \(.term)"' 2>/dev/null)

# The verb already reports which standard it found under neither root, and
# reading the findings alone turned a narrowed check into a clean pass. An
# empty ban list means one thing when both standards were read and another
# when neither was.
missing=$(printf '%s' "$record" |
  jq -r '[.bans.missingStandards[]?] | join(", ")' 2>/dev/null)

[ -z "$hits" ] && [ -z "$unread" ] && [ -z "$missing" ] && exit 0

nl=$'\n'
msg=""

if [ -n "$unread" ]; then
  msg=$(printf 'Standards-audit: nothing checked in %s. Resolved neither the checkout CLI at %s/src/cli.ts nor an installed `aitk` binary. Install one with `bun add -g @erclx/aitk`.' "$file" "$root")
elif [ -n "$missing" ]; then
  msg=$(printf 'Standards-audit: no ban read for %s, so %s was checked against a narrowed set. Looked under .claude/standards/ then standards/. Restore it with `aitk standards install`.' "$missing" "$file")
fi

if [ -n "$hits" ]; then
  found=$(printf 'Standards-audit: prose.md and markdown.md violations in %s. Rewrite the sentence (do not lazy-swap). A code span is the answer only where the token is genuinely an identifier under discussion.\n%s' "$file" "$hits")
  msg="${msg:+$msg$nl}$found"
fi

jq -nc --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
