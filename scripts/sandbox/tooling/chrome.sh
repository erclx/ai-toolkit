#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_anchor() {
  export ANCHOR_REPO="bun-crxjs-template"
}

stage_setup() {
  inject_tooling_configs "chrome" "."
  inject_tooling_seeds "chrome" "."
  inject_tooling_manifest "chrome" "."

  log_step "Initializing Husky"
  bunx husky

  log_step "Setting script permissions"
  chmod +x scripts/*.sh
  log_info "Scripts made executable"

  log_step "Applying auto-fixes"
  bun run lint:fix
  log_info "Lint autofix applied to scaffolded files"

  log_step "Running verification"
  if bash scripts/verify.sh; then
    log_info "All checks passed"
  else
    log_warn "Verification failed — check configs"
  fi

  log_step "Scenario ready: Chrome tooling test"
  log_info "Context: golden configs from tooling/vite-react + tooling/chrome applied"
  log_info "Action:  inspect configs, run 'bun run check' to verify"
}
