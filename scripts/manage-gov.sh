#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk gov [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    install   ${GREY}# Bootstrap rules for a stack into a project${NC}"
  echo -e "${GREY}│${NC}    sync      ${GREY}# Sync existing rules and standards to another project${NC}"
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
    select_option "Governance command?" "install" "sync"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  install)
    exec "$PROJECT_ROOT/scripts/gov/install.sh" "$@"
    ;;
  sync)
    exec "$PROJECT_ROOT/scripts/gov/sync.sh" "$@"
    ;;
  *)
    echo -e "${GREY}┌${NC}"
    log_error "Unknown command: $command. Use 'install' or 'sync'."
    ;;
  esac
}

main "$@"
