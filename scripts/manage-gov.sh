#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk gov [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    install [stack] [path]   ${GREY}# Bootstrap rules for a stack into a project${NC}"
  echo -e "${GREY}│${NC}    sync [path]              ${GREY}# Update rules already present in target${NC}"
  echo -e "${GREY}│${NC}    build [path]             ${GREY}# Concatenate rules into .cursor/.tmp/rules.md${NC}"
  echo -e "${GREY}│${NC}    list [options]           ${GREY}# List available stacks and rules${NC}"
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

  open_timeline "aitk gov"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Gov command?" "install" "sync" "build" "list"
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
  build)
    exec "$PROJECT_ROOT/scripts/gov/build.sh" "$@"
    ;;
  list)
    exec "$PROJECT_ROOT/scripts/gov/list.sh" "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'install', 'sync', 'build', or 'list'."
    ;;
  esac
}

main "$@"
