#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  log_step "Initializing package"
  cat <<'EOF' >package.json
{
  "name": "sandbox-cursor-tooling",
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

  inject_tooling_manifest "cursor" "."

  log_step "Scenario ready: Cursor tooling init"
  log_info "Context: Empty project with cursor gitignore entry injected"
  log_info "Verify:  .gitignore contains .cursor/.tmp/"
}
