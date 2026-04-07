#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    sync [path]        ${GREY}# Sync all installed domains in a project${NC}"
  echo -e "${GREY}│${NC}    sandbox [cat:cmd]  ${GREY}# Provision and run sandbox scenarios${NC}"
  echo -e "${GREY}│${NC}    gov [command]      ${GREY}# Governance commands (install, sync)${NC}"
  echo -e "${GREY}│${NC}    standards [cmd]    ${GREY}# Standards commands (install, sync)${NC}"
  echo -e "${GREY}│${NC}    snippets [cmd]     ${GREY}# Snippets commands (install, sync)${NC}"
  echo -e "${GREY}│${NC}    prompts [cmd]      ${GREY}# Prompts commands (install, sync)${NC}"
  echo -e "${GREY}│${NC}    tooling [cmd]      ${GREY}# Manage tooling stacks (sync, ref, create)${NC}"
  echo -e "${GREY}│${NC}    claude [cmd]       ${GREY}# Claude workflow (init, sync, prompt)${NC}"
  echo -e "${GREY}│${NC}    wiki [cmd]         ${GREY}# Wiki commands (init)${NC}"
  echo -e "${GREY}│${NC}    antigravity [cmd]  ${GREY}# Antigravity workflows (install, sync)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Sandbox:${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox             ${GREY}# Interactive scenario picker${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox git:commit  ${GREY}# Run specific scenario${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox reset       ${GREY}# Reset sandbox to baseline${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox clean       ${GREY}# Wipe the sandbox${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk sync ../my-app"
  echo -e "${GREY}│${NC}    aitk sandbox git:commit"
  echo -e "${GREY}│${NC}    aitk gov install react"
  echo -e "${GREY}│${NC}    aitk gov sync ../my-app"
  echo -e "${GREY}│${NC}    aitk standards sync ../my-app"
  echo -e "${GREY}│${NC}    aitk snippets install base ../my-app"
  echo -e "${GREY}│${NC}    aitk snippets sync ../my-app"
  echo -e "${GREY}│${NC}    aitk prompts install scripting ../my-app"
  echo -e "${GREY}│${NC}    aitk prompts sync ../my-app"
  echo -e "${GREY}│${NC}    aitk tooling sync base"
  echo -e "${GREY}│${NC}    aitk tooling create"
  echo -e "${GREY}│${NC}    aitk claude prompt"
  echo -e "${GREY}│${NC}    aitk antigravity install git ../my-app"
  echo -e "${GREY}│${NC}    aitk antigravity sync ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" || -z "$1" ]]; then
    show_help
  fi

  case "$1" in
  sync)
    shift
    exec "$PROJECT_ROOT/scripts/manage-sync.sh" "$@"
    ;;
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
  snippets)
    shift
    exec "$PROJECT_ROOT/scripts/manage-snippets.sh" "$@"
    ;;
  prompts)
    shift
    exec "$PROJECT_ROOT/scripts/manage-prompts.sh" "$@"
    ;;
  tooling)
    shift
    exec "$PROJECT_ROOT/scripts/manage-tooling.sh" "$@"
    ;;
  claude)
    shift
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" "$@"
    ;;
  wiki)
    shift
    exec "$PROJECT_ROOT/scripts/manage-wiki.sh" "$@"
    ;;
  antigravity)
    shift
    exec "$PROJECT_ROOT/scripts/manage-antigravity.sh" "$@"
    ;;
  *)
    echo -e "${GREY}┌${NC}"
    log_error "Unknown command '$1'. Run 'aitk --help' for usage."
    ;;
  esac
}

main "$@"
