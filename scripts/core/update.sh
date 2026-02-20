#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

main() {
  check_dependencies

  echo -e "${GREY}┌${NC}"

  log_step "Interactive Dependency Update"
  echo -e "${GREY}│${NC}"
  bun update --interactive 2>&1 | pipe_output

  log_step "Verifying Project Health"
  if [ -f "$SCRIPT_DIR/verify.sh" ]; then
    "$SCRIPT_DIR/verify.sh" --nested
    log_info "All checks passed"
  else
    log_warn "Verification script not found, skipping."
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Update Complete.${NC}"
}

main "$@"
