#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  log_step "Initializing package"
  cat <<'EOF' >package.json
{
  "name": "sandbox-gemini-tooling",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF
  log_info "package.json created"

  cat <<'EOF' >.gitignore
node_modules/
EOF
  log_info ".gitignore created"

  log_step "Running gemini sync"
  inject_tooling_configs "gemini" "."

  log_step "SCENARIO READY: Gemini Tooling Init"
  log_info "Context: Empty project with .gemini/settings.json seeded"
  log_info "Verify:  .gemini/settings.json exists with gemini-2.5-flash model"
  log_info "Verify:  .gemini/.tmp/ is gitignored"
}
