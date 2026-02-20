#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev tooling <command> [stack] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    sync        Sync tooling configs and manifest to target"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack       Name of the tooling stack (e.g., base, vite-react)"
  echo -e "${GREY}│${NC}    target-path Target directory (default: current directory)"
  echo -e "${GREY}└${NC}"
  exit 0
}

cmd_sync() {
  local stack="$1"
  local target="${2:-.}"

  if [ -z "$stack" ]; then
    local stacks=()
    if ls -d "$PROJECT_ROOT/tooling"/*/ >/dev/null 2>&1; then
      mapfile -t stacks < <(find "$PROJECT_ROOT/tooling" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)
    fi

    if [ ${#stacks[@]} -eq 0 ]; then
      log_error "No tooling stacks found in $PROJECT_ROOT/tooling"
    fi

    select_option "Select tooling stack:" "${stacks[@]}"
    stack="$SELECTED_OPTION"
  fi

  if [ ! -d "$PROJECT_ROOT/tooling/$stack" ]; then
    log_error "Stack not found: $stack"
  fi

  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync tooling to ai-toolkit root. Files here are the source of truth."
  fi

  log_step "Syncing Tooling Stack: $stack"
  inject_tooling_configs "$stack" "$target"
  inject_tooling_manifest "$stack" "$target"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}" >&2

  local command="$1"
  if [ -z "$command" ]; then
    local commands=("sync")
    select_option "Select tooling command:" "${commands[@]}"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  sync)
    cmd_sync "$@"
    ;;
  *)
    log_error "Unknown tooling command: $command"
    ;;
  esac

  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ Tooling operation complete${NC}" >&2
}

main "$@"
