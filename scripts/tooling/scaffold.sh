#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling Scaffold Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev tooling scaffold [stack]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Scaffolds a new stack with stub manifest, reference, configs, and seeds."
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
    echo -e "${GREY}│${NC}" >&2
    echo -ne "${GREEN}◆${NC} Stack name? " >&2
    read -r stack
    echo -e "\033[1A\r\033[K${GREY}◇${NC} Stack name? ${WHITE}${stack}${NC}" >&2
  fi

  if [ -z "$stack" ]; then
    log_error "Stack name is required"
  fi

  local dest="$PROJECT_ROOT/tooling/$stack"

  if [ -d "$dest" ]; then
    log_error "Stack already exists: $stack"
  fi

  echo -e "${GREY}┌${NC}" >&2
  log_step "Scaffolding Stack: $stack"

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

[sync]
source = "configs"

[dependencies.dev]
packages = []

[scripts]

[gitignore]
EOF
  log_add "tooling/$stack/manifest.toml"

  cat >"$dest/reference.md" <<EOF
# TOOLING $(echo "$stack" | tr '[:lower:]' '[:upper:]' | tr '-' ' ') REFERENCE

## Overview

[One or two sentences: what this stack provides and its purpose.]

EOF
  log_add "tooling/$stack/reference.md"

  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ Stack scaffolded${NC}" >&2
}

main "$@"
