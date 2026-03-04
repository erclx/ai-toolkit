#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "AI Toolkit"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    sandbox [cat:cmd]  ${GREY}# Provision and run sandbox scenarios${NC}"
  echo -e "${GREY}│${NC}    gov [command]      ${GREY}# Governance commands (install, sync)${NC}"
  echo -e "${GREY}│${NC}    standards [cmd]    ${GREY}# Standards commands (install, sync)${NC}"
  echo -e "${GREY}│${NC}    tooling [cmd]      ${GREY}# Manage tooling stacks and configs${NC}"
  echo -e "${GREY}│${NC}    claude [cmd]       ${GREY}# Claude workflow (init, update, prompt)${NC}" echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Sandbox:${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox             ${GREY}# Interactive scenario picker${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox git:commit  ${GREY}# Run specific scenario${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox reset       ${GREY}# Reset sandbox to baseline${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox clean       ${GREY}# Wipe the sandbox${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox git:commit"
  echo -e "${GREY}│${NC}    aitk gov install react"
  echo -e "${GREY}│${NC}    aitk gov sync ../my-app"
  echo -e "${GREY}│${NC}    aitk standards sync ../my-app"
  echo -e "${GREY}│${NC}    aitk tooling sync base"
  echo -e "${GREY}│${NC}    aitk claude prompt"
  echo -e "${GREY}│${NC}    aitk claude review"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" || -z "$1" ]]; then
    show_help
  fi

  case "$1" in
  sandbox)
    shift
    exec "$PROJECT_ROOT/scripts/manage-sandbox.sh" "$@"
    ;;
  gov)
    shift
    exec "$PROJECT_ROOT/scripts/manage-gov.sh" "$@"
    ;;
  standards)
    shift
    exec "$PROJECT_ROOT/scripts/manage-standards.sh" "$@"
    ;;
  tooling)
    shift
    exec "$PROJECT_ROOT/scripts/manage-tooling.sh" "$@"
    ;;
  claude)
    shift
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" "$@"
    ;;
  *)
    echo -e "${GREY}┌${NC}"
    log_error "Unknown command: $1. Run 'aitk --help' for usage."
    ;;
  esac
}

main "$@"
