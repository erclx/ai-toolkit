#!/bin/bash

TOOLING_STACK_EXCLUDE=("claude")

is_tooling_stack_excluded() {
  local name="$1"
  local excluded
  for excluded in "${TOOLING_STACK_EXCLUDE[@]}"; do
    if [ "$name" = "$excluded" ]; then
      return 0
    fi
  done
  return 1
}

list_tooling_stacks() {
  local tooling_dir="${1:-$PROJECT_ROOT/tooling}"
  local name
  while IFS= read -r entry; do
    name=$(basename "$entry")
    is_tooling_stack_excluded "$name" && continue
    echo "$name"
  done < <(find "$tooling_dir" -mindepth 1 -maxdepth 1 -type d | sort)
}
