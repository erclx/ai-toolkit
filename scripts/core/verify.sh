#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

NESTED=false
[[ "${1:-}" == "--nested" ]] && NESTED=true

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

run_check() {
  local cmd=$1
  local err_msg=$2
  if ! eval "$cmd" 2>&1 | pipe_output; then
    log_error "$err_msg"
  fi
}

main() {
  check_dependencies

  if [ "$NESTED" = false ]; then echo -e "${GREY}┌${NC}"; fi

  log_step "1. Formatting"
  run_check "bun run check:format" "Format check failed"
  log_info "Format check passed"

  log_step "2. Spelling"
  run_check "bun run check:spell" "Spell check failed"
  log_info "Spell check passed"

  log_step "3. Shell"
  run_check "bun run check:shell" "Shell check failed"
  log_info "Shell check passed"

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Verification passed${NC}"
  fi
}

main "$@"
