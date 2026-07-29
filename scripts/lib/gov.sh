#!/usr/bin/env bash

# Sole survivor of the gov lib. Called once per rule file inside install and
# sandbox loops, where routing through the CLI would cost a process per file.

rule_subdir() {
  local src="$1"
  local rules_root="${2:-$PROJECT_ROOT/governance/rules}"
  local rel="${src#"$rules_root/"}"
  local subdir
  subdir=$(dirname "$rel")
  [ "$subdir" = "." ] && subdir=""
  echo "$subdir"
}
