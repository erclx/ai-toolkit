#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling create usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk tooling create [stack]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Creates a new stack with stub manifest, reference, configs, and seeds."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack   Name of the new stack to create"
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

  local stack="$1"

  if [ -z "$stack" ]; then
    ask "Stack name?" "stack"
  fi

  if [ -z "$stack" ]; then
    log_error "Stack name is required"
  fi

  local dest="$PROJECT_ROOT/tooling/$stack"

  if [ -d "$dest" ]; then
    log_error "Stack already exists: $stack"
  fi

  log_step "Creating"
  log_add "tooling/$stack/configs/"
  log_add "tooling/$stack/seeds/"
  log_add "tooling/$stack/manifest.toml"
  log_add "tooling/$stack/reference.md"

  select_option "Create stack at tooling/$stack?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Applying"

  mkdir -p "$dest/configs"
  log_add "tooling/$stack/configs/"

  mkdir -p "$dest/seeds"
  log_add "tooling/$stack/seeds/"

  cat >"$dest/manifest.toml" <<EOF
[stack]
name = "$stack"
extends = ""
runtime = ""
scaffold = ""

[dependencies.dev]
packages = []

[scripts]
"script-key" = "command --flag"

[gitignore]
"# $stack" = ["pattern/", ".file"]
EOF
  log_add "tooling/$stack/manifest.toml"
  cat >"$dest/reference.md" <<EOF
# Tooling $stack reference

## Overview

[One or two sentences: what this stack provides and its purpose.]

EOF
  log_add "tooling/$stack/reference.md"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Stack created${NC}"
}

main "$@"
