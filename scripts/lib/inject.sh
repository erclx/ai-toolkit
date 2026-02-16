#!/bin/bash

inject_governance() {
  log_step "Injecting Governance Assets"

  local rules_source="$PROJECT_ROOT/scripts/assets/cursor/rules"
  local rules_target=".cursor/rules"
  local standards_source="$PROJECT_ROOT/scripts/assets/standards"
  local standards_target="standards"

  if [ -d "$rules_source" ]; then
    mkdir -p "$rules_target" 
    find "$rules_source" -type f -name "*.mdc" -exec cp {} "$rules_target/" \;
    shopt -s nullglob
    for f in "$rules_target"/*.mdc; do
      log_info "Injected Rule: .cursor/rules/$(basename "$f")"
    done
    shopt -u nullglob
  else
    log_warn "Source rules not found at $rules_source. Skipping injection."
  fi

  if [ -d "$standards_source" ]; then
    mkdir -p "$standards_target"
    cp -r "$standards_source/." "$standards_target/"
    shopt -s nullglob
    for f in "$standards_target"/*.md; do
      log_info "Injected Standard:  standards/$(basename "$f")"
    done
    shopt -u nullglob
  else
    log_warn "Source docs not found at $standards_source. Skipping injection."
  fi
}

inject_dependencies() {
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
