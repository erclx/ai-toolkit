#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk sync [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk sync ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

validate_target() {
  local target="${1:-.}"
  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi
  echo "$target"
}

guard_root() {
  local target="$1"
  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync to toolkit root. Files here are the source of truth."
  fi
}

check_clean_tree() {
  local target="$1"
  local status
  status=$(git -C "$target" status --short 2>/dev/null || true)
  if [ -n "$status" ]; then
    log_error "Working tree has uncommitted changes. Commit or stash before syncing."
  fi
  log_info "Working tree clean"
}

detect_domains() {
  local target="$1"
  local found=0

  if [ -d "$target/standards" ]; then
    log_info "standards"
    found=$((found + 1))
  else
    log_warn "standards (not installed, skipping)"
  fi

  if [ -d "$target/snippets" ]; then
    log_info "snippets"
    found=$((found + 1))
  else
    log_warn "snippets (not installed, skipping)"
  fi

  if [ -d "$target/prompts" ]; then
    log_info "prompts"
    found=$((found + 1))
  else
    log_warn "prompts (not installed, skipping)"
  fi

  if [ -d "$target/.cursor" ]; then
    log_info "governance"
    found=$((found + 1))
  else
    log_warn "governance (not installed, skipping)"
  fi

  echo "$found"
}

run_syncs() {
  local target="$1"

  if [ -d "$target/standards" ]; then
    bash "$PROJECT_ROOT/scripts/manage-standards.sh" sync "$target"
  fi

  if [ -d "$target/snippets" ]; then
    bash "$PROJECT_ROOT/scripts/manage-snippets.sh" sync "$target"
  fi

  if [ -d "$target/prompts" ]; then
    bash "$PROJECT_ROOT/scripts/manage-prompts.sh" sync "$target"
  fi

  if [ -d "$target/.cursor" ]; then
    bash "$PROJECT_ROOT/scripts/manage-gov.sh" sync "$target"
  fi
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  local target
  target=$(validate_target "${1:-}")
  guard_root "$target"

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk sync${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Checking working tree${NC}"
  trap close_timeline EXIT

  check_clean_tree "$target"

  log_step "Detecting domains"

  local found
  found=$(detect_domains "$target")

  if [ "$found" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${YELLOW}! No domains installed in target. Run domain install commands first.${NC}"
    exit 0
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"

  run_syncs "$target"
}

main "$@"
