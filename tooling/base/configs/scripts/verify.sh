#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

NESTED=false
[[ "${1:-}" == "--nested" ]] && NESTED=true

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

pipe_output() { while IFS= read -r line; do echo -e "${GREY}│${NC}  $line"; done; }

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
