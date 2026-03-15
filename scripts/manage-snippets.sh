#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk snippets [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    install [category] [path]   ${GREY}# Copy slugs for a category to a project${NC}"
  echo -e "${GREY}│${NC}    sync [path]                 ${GREY}# Update snippets already present in target${NC}"
  echo -e "${GREY}│${NC}    create                      ${GREY}# Create a new snippet and register it${NC}"
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

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk snippets${NC}"

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Snippets command?" "install" "sync" "create"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  install)
    exec "$PROJECT_ROOT/scripts/snippets/install.sh" "$@"
    ;;
  sync)
    exec "$PROJECT_ROOT/scripts/snippets/sync.sh" "$@"
    ;;
  create)
    exec "$PROJECT_ROOT/scripts/snippets/create.sh" "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'install', 'sync', 'create', or --help."
    ;;
  esac
}

main "$@"
