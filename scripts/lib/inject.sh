#!/bin/bash

inject_governance() {
  log_step "Injecting Governance Assets"

  local rules_source="$PROJECT_ROOT/scripts/assets/cursor/rules"
  local rules_target=".cursor/rules"
  local docs_source="$PROJECT_ROOT/scripts/assets/docs"
  local docs_target="docs"

  if [ -d "$rules_source" ]; then
    mkdir -p "$rules_target"
    find "$rules_source" -type f -name "*.mdc" -exec cp {} "$rules_target/" \;
    
    count=$(find "$rules_target" -name "*.mdc" | wc -l)
    log_info "Injected $count Governance Rules into .cursor/rules/"
  else
    log_warn "Source rules not found at $rules_source"
  fi

  if [ -d "$docs_source" ]; then
    mkdir -p "$docs_target"
    cp -r "$docs_source/." "$docs_target/"
    
    count=$(find "$docs_target" -name "*.md" | wc -l)
    log_info "Injected $count Documentation files into docs/"
  else
    log_warn "Source docs not found at $docs_source"
  fi
}

inject_dependencies() {
  log_step "Provisioning Dependencies"

  if [ -f "package.json" ]; then
    if command -v bun &> /dev/null; then
      log_info "Detected Node project. Running bun install..."
      bun install
      log_info "Dependencies installed via Bun"
    elif command -v npm &> /dev/null; then
      log_info "Detected Node project. Running npm install..."
      npm install
      log_info "Dependencies installed via NPM"
    else
      log_warn "package.json found but no package manager (bun/npm) detected"
    fi
  elif [ -f "pyproject.toml" ] || [ -f "uv.lock" ]; then
    if command -v uv &> /dev/null; then
      log_info "Detected Python project. Running uv sync..."
      uv sync
      log_info "Dependencies synced via UV"
    else
      log_warn "Python manifest found but 'uv' not detected"
    fi
  else
    log_info "No manifest detected. Skipping dependency installation."
  fi
}
