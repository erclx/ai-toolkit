#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling ref usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk tooling ref [stack] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Drops reference docs only. No config or dependency changes."
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

collect_references() {
  local stack="$1"
  local target="$2"
  local -n _pending=$3

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_references "$extends" "$target" "$3"
  fi

  local reference_file="$PROJECT_ROOT/tooling/$stack/reference.md"
  [ ! -f "$reference_file" ] && return

  local dest="$target/tooling/$stack.md"

  if [ -f "$dest" ] && diff -q "$reference_file" "$dest" >/dev/null 2>&1; then
    log_info "tooling/$stack.md"
    return
  fi

  log_add "tooling/$stack.md"
  _pending+=("$stack")
}

apply_references() {
  local target="$1"
  shift
  local stacks=("$@")

  mkdir -p "$target/tooling"

  for stack in "${stacks[@]}"; do
    local src="$PROJECT_ROOT/tooling/$stack/reference.md"
    cp "$src" "$target/tooling/$stack.md"
    log_add "tooling/$stack.md"
  done
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

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
    log_error "Cannot sync tooling to toolkit root. Files here are the source of truth."
  fi

  local pending=()

  echo -e "${GREY}┌${NC}" >&2
  echo -e "${GREY}├${NC} ${WHITE}Scanning references: $stack${NC}" >&2
  collect_references "$stack" "$target" pending

  if [ "${#pending[@]}" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ References up to date${NC}" >&2
    exit 0
  fi

  local dest_display="$target/tooling/"
  dest_display="${dest_display#./}"

  select_option "Sync ${#pending[@]} reference(s) to $dest_display?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Applying changes"
  apply_references "$target" "${pending[@]}"

  trap - EXIT
  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ References synced${NC}" >&2
}

main "$@"
