#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

SKILLS_DIR="$PROJECT_ROOT/claude/skills"

# A shipped skill runs from a target project, where the toolkit's own wiki/ does
# not exist. Anchoring on a non-path character keeps a target's .claude/wiki/ legal.
BANNED_PATH_PATTERN='(^|[^[:alnum:]._/-])wiki/'

[ -d "$SKILLS_DIR" ] || exit 0

matches=$(grep -rnE "$BANNED_PATH_PATTERN" "$SKILLS_DIR" || true)

[ -z "$matches" ] && exit 0

echo "Shipped skills reference a repo-local path that does not exist in a target project:"
echo "$matches" | sed "s|^$PROJECT_ROOT/||"
echo
echo "Reach supporting prose through an canon docs command, a standard cited at the flat root, or inlined text."
exit 1
