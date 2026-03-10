#!/usr/bin/env bash

ROOT="${1:-.}"

PATTERNS="
ai toolkit
ai-toolkit
"

cd "$ROOT" || exit 1

echo "$PATTERNS" | while IFS= read -r pattern; do
  [ -z "$pattern" ] && continue
  git grep -rin "$pattern" | awk -F: '
    prev != $1 { print $1; prev = $1 }
    { print "  " $2 ": " $3 }
  '
done
