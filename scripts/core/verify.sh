#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

NESTED="${VERIFY_NESTED:-false}"

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

run_check() {
  local cmd=$1
  local err_msg=$2
  local output
  if ! output=$(eval "$cmd" 2>&1); then
    echo "$output" | pipe_output
    log_error "$err_msg"
  fi
  echo "$output" | pipe_output
}

main() {
  check_dependencies

  if [ "$NESTED" = false ]; then echo -e "${GREY}┌${NC}"; fi

  echo -e "${GREY}├${NC} ${WHITE}Formatting${NC}"
  run_check "bun run format" "Format failed"
  log_info "Format applied"

  log_step "Format check"
  run_check "bun run check:format" "Format check failed"
  log_info "Format check passed"

  log_step "Spelling"
  run_check "bun run check:spell" "Spell check failed"
  log_info "Spell check passed"

  log_step "Shell"
  run_check "bun run check:shell" "Shell check failed"
  log_info "Shell check passed"

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Verification passed${NC}"
  fi
}

main "$@"
