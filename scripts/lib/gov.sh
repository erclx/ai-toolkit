#!/usr/bin/env bash

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
