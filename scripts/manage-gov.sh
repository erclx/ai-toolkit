#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev gov [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    build     ${GREY}# Scan, compile, and commit governance artifacts${NC}"
  echo -e "${GREY}│${NC}    sync      ${GREY}# Sync rules and standards to another project${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  local command="$1"

  if [ -z "$command" ]; then
    echo -e "${GREY}┌${NC}"
    select_option "Governance command?" "build" "sync"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  build)
    exec "$PROJECT_ROOT/scripts/build-gov.sh" "$@"
    ;;
  sync)
    exec "$PROJECT_ROOT/scripts/sync-gov.sh" "$@"
    ;;
  *)
    echo -e "${GREY}┌${NC}"
    log_error "Unknown command: $command. Use 'build' or 'sync'."
    ;;
  esac
}

main "$@"
