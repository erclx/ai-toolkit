#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev tooling [stack] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack         Name of the tooling stack (e.g., base, vite-react)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

select_stack() {
  local stacks=()
  if ls -d "$PROJECT_ROOT/tooling"/*/ >/dev/null 2>&1; then
    mapfile -t stacks < <(find "$PROJECT_ROOT/tooling" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
  fi

  if [ ${#stacks[@]} -eq 0 ]; then
    log_error "No tooling stacks found in $PROJECT_ROOT/tooling"
  fi

  select_option "Select tooling stack:" "${stacks[@]}"
  echo "$SELECTED_OPTION"
}

collect_stack_configs() {
  local stack="$1"
  local target="$2"
  local -n _new=$3
  local -n _drifted=$4
  local -n _matching=$5

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_configs "$extends" "$target" _new _drifted _matching
  fi

  local configs_dir="$PROJECT_ROOT/tooling/$stack/configs"
  [ ! -d "$configs_dir" ] && return

  while IFS= read -r file; do
    local rel="${file#"$configs_dir"/}"
    local dest="$target/$rel"

    if [ ! -f "$dest" ]; then
      _new+=("$rel")
    elif diff -q "$file" "$dest" >/dev/null 2>&1; then
      _matching+=("$rel")
    else
      _drifted+=("$rel")
    fi
  done < <(find "$configs_dir" -type f | sort)
}

scan_configs() {
  local stack="$1"
  local target="$2"

  log_step "Scanning Configs"

  collect_stack_configs "$stack" "$target" NEW_FILES DRIFTED_FILES MATCHING_FILES

  for f in "${MATCHING_FILES[@]}"; do
    log_info "${GREY}Matching:  $f${NC}"
  done
  for f in "${DRIFTED_FILES[@]}"; do
    log_warn "Drifted:   $f"
  done
  for f in "${NEW_FILES[@]}"; do
    log_add "Missing:   $f"
  done

  TOTAL_CHANGES=$((${#NEW_FILES[@]} + ${#DRIFTED_FILES[@]}))
}

cmd_sync() {
  local stack="$1"
  local target="${2:-.}"

  if [ -z "$stack" ]; then
    stack=$(select_stack)
  fi

  if [ ! -d "$PROJECT_ROOT/tooling/$stack" ]; then
    log_error "Stack not found: $stack"
  fi

  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync tooling to ai-toolkit root. Files here are the source of truth."
  fi

  NEW_FILES=()
  DRIFTED_FILES=()
  MATCHING_FILES=()
  TOTAL_CHANGES=0

  scan_configs "$stack" "$target"

  if [ "$TOTAL_CHANGES" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Everything up to date${NC}" >&2
    exit 0
  fi

  local summary=""
  [ "${#DRIFTED_FILES[@]}" -gt 0 ] && summary+="${#DRIFTED_FILES[@]} drifted"
  if [ "${#NEW_FILES[@]}" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${#NEW_FILES[@]} missing"
  fi

  select_option "Apply $TOTAL_CHANGES changes ($summary)?" "Yes" "No"

  if [ "$SELECTED_OPTION" == "No" ]; then
    log_warn "Sync cancelled"
    echo -e "${GREY}└${NC}" >&2
    exit 0
  fi

  log_step "Applying Changes"
  inject_tooling_configs "$stack" "$target"
  inject_tooling_manifest "$stack" "$target"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}" >&2

  cmd_sync "$@"

  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ Tooling sync complete${NC}" >&2
}

main "$@"
