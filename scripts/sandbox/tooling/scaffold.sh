#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

collect_scaffold_stacks() {
  local -n _stacks=$1
  local -n _commands=$2

  while IFS= read -r manifest; do
    local stack
    stack=$(basename "$(dirname "$manifest")")

    local scaffold
    scaffold=$(grep '^scaffold' "$manifest" 2>/dev/null | cut -d'"' -f2)

    if [ -n "$scaffold" ]; then
      _stacks+=("$stack")
      _commands["$stack"]="$scaffold"
    fi
  done < <(find "$PROJECT_ROOT/tooling" -name "manifest.toml" | sort)
}

stage_setup() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"

  local stacks=()
  declare -A commands

  collect_scaffold_stacks stacks commands

  if [ ${#stacks[@]} -eq 0 ]; then
    log_error "No stacks with scaffold commands found in tooling/"
  fi

  select_option "Select stack to scaffold:" "${stacks[@]}"
  local selected="$SELECTED_OPTION"
  local cmd="${commands[$selected]}"
  local resolved_cmd="${cmd//\{\{name\}\}/sandbox-scaffold}"

  log_step "Scaffolding $selected"
  log_info "Command: $resolved_cmd"
  echo -e "${GREY}│${NC}"

  eval "$resolved_cmd"

  log_step "SCENARIO READY: $selected scaffold"
  log_info "Location: .sandbox/sandbox-scaffold/"
  log_info "Raw upstream template — no golden configs applied"
  log_info "Run 'gdev clean' to wipe when done"
}
