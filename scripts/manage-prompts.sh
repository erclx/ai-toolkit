#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk prompts [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    install [category] [path]   ${GREY}# Copy prompts for a category to a project${NC}"
  echo -e "${GREY}│${NC}    sync [path]                 ${GREY}# Update prompts already present in target${NC}"
  echo -e "${GREY}│${NC}    list                        ${GREY}# List available prompts with descriptions${NC}"
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
  echo -e "${GREY}│${NC} ${WHITE}aitk prompts${NC}"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Prompts command?" "install" "sync" "list"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  install)
    exec "$PROJECT_ROOT/scripts/prompts/install.sh" "$@"
    ;;
  sync)
    exec "$PROJECT_ROOT/scripts/prompts/sync.sh" "$@"
    ;;
  list)
    exec "$PROJECT_ROOT/scripts/prompts/list.sh" "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'install', 'sync', 'list', or --help."
    ;;
  esac
}

main "$@"
