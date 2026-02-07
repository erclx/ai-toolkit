#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  log_step "Staging Governance Environment"

  local rules_source="$PROJECT_ROOT/scripts/assets/cursor/rules"
  local rules_target=".cursor/rules"
  local docs_source="$PROJECT_ROOT/scripts/assets/docs"
  local docs_target="docs"

  if [ -d "$rules_source" ]; then
    mkdir -p "$rules_target"
    cp -r "$rules_source/." "$rules_target/"
    shopt -s nullglob
    for f in "$rules_source"/*.mdc; do
      log_info "Injected Rule: .cursor/rules/$(basename "$f")"
    done
    shopt -u nullglob
  else
    log_warn "Source rules not found at $rules_source. Skipping injection."
  fi

  if [ -d "$docs_source" ]; then
    mkdir -p "$docs_target"
    cp -r "$docs_source/." "$docs_target/"
    shopt -s nullglob
    for f in "$docs_source"/*.md; do
      log_info "Injected Doc:  docs/$(basename "$f")"
    done
    shopt -u nullglob
  else
    log_warn "Source docs not found at $docs_source. Skipping injection."
  fi

  log_step "Provisioning Dependencies"

  if [ -f "package.json" ]; then
  if command -v bun &> /dev/null; then
      log_info "Detected Node project. Running bun install..."
    bun install
      log_info "Dependencies installed"
    else
      log_warn "package.json found but bun missing"
    fi
  elif [ -f "pyproject.toml" ] || [ -f "uv.lock" ]; then
    if command -v uv &> /dev/null; then
      log_info "Detected Python project. Running uv sync..."
      uv sync
      log_info "Dependencies synced"
  else
      log_warn "Python manifest found but uv missing"
    fi
  else
    log_info "No manifest detected. Skipping install."
  fi

  echo -e "${GREY}│${NC}"
}