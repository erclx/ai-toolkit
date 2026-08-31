#!/usr/bin/env bash
set -e
set -o pipefail

# Rewrites the generated path block in the shipped overwrite contract, which
# names every file a tooling sync can replace. The category reaches past the
# linters its name suggests, into the CI workflow, the end-to-end harness, and
# the shell scripts under scripts/, so a reader cannot infer the list. Generating
# it is what keeps a stack gaining a file from leaving the contract wrong.
#
# The stack names come from `tooling list` rather than from a directory walk,
# so a stack the verb excludes never reaches a contract about what the verb does.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

TOOLING_DIR="$PROJECT_ROOT/tooling"
CONTRACT="$PROJECT_ROOT/claude/skills/canon-cli/SKILL.md"

BEGIN="<!-- generated:tooling-paths -->"
END="<!-- /generated:tooling-paths -->"

[ -d "$TOOLING_DIR" ] || exit 0
[ -f "$CONTRACT" ] || exit 0

grep -qF "$BEGIN" "$CONTRACT" || {
  echo "Missing $BEGIN marker in $CONTRACT" >&2
  exit 1
}

block="$(mktemp)"
trap 'rm -f "$block" "$CONTRACT.tmp"' EXIT

{
  echo "$BEGIN"
  echo
  while IFS= read -r stack; do
    [ -d "$TOOLING_DIR/$stack/configs" ] || continue
    echo "### $stack"
    echo
    while IFS= read -r rel; do
      echo "- \`$rel\`"
    done < <(cd "$TOOLING_DIR/$stack/configs" && find . -type f | sed 's|^\./||' | sort)
    echo
  done < <(bun "$PROJECT_ROOT/src/cli.ts" tooling list --json | jq -r '.stacks[].name' | sort)
  echo "$END"
} >"$block"

# awk streams the file rather than editing in place, so a pattern that matches
# nothing produces a file missing the block instead of an unchanged one that
# exits zero.
awk -v block_file="$block" -v begin="$BEGIN" -v end="$END" '
  $0 == begin { while ((getline line < block_file) > 0) print line; skipping = 1; next }
  $0 == end { skipping = 0; next }
  !skipping { print }
' "$CONTRACT" >"$CONTRACT.tmp"

# The destination is a tracked file with a mode the copy must not inherit from
# mktemp, so the content moves onto the original rather than replacing it.
cat "$CONTRACT.tmp" >"$CONTRACT"
rm -f "$CONTRACT.tmp"
