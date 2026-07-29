#!/usr/bin/env bash
#
# What survives here and why. Both functions are called from inside a loop, so
# routing them through the CLI would cost a process per file.
#
#   rule_subdir       stays permanently. Four of its five callers are sandbox
#                     scripts, and the sandbox stays bash by decision.
#   strip_frontmatter stays until the docs domain migrates. Its only caller is
#                     scripts/docs/get.sh.
#
# The payload builder that used to live here is TypeScript now, in
# src/gov/payload.ts.

strip_frontmatter() {
  local file="$1"
  local in_frontmatter=0
  local past_frontmatter=0

  while IFS= read -r line; do
    if [ "$past_frontmatter" -eq 1 ]; then
      echo "$line"
      continue
    fi

    if [ "$in_frontmatter" -eq 0 ] && [ "$line" = "---" ]; then
      in_frontmatter=1
      continue
    fi

    if [ "$in_frontmatter" -eq 1 ] && [ "$line" = "---" ]; then
      past_frontmatter=1
      continue
    fi

    if [ "$in_frontmatter" -eq 0 ]; then
      echo "$line"
    fi
  done <"$file"
}

rule_subdir() {
  local src="$1"
  local rules_root="${2:-$PROJECT_ROOT/governance/rules}"
  local rel="${src#"$rules_root/"}"
  local subdir
  subdir=$(dirname "$rel")
  [ "$subdir" = "." ] && subdir=""
  echo "$subdir"
}
