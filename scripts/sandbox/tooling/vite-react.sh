#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Injecting Tooling Configs (base + vite-react)"
  inject_tooling_configs "vite-react" "."

  log_step "Seeding Dictionaries (base + vite-react)"
  inject_tooling_seeds "vite-react" "."

  log_step "Applying Tooling Manifest (base + vite-react)"
  inject_tooling_manifest "vite-react" "."

  log_step "Initializing Husky"
  bunx husky

  log_step "Scaffolding Test Setup"
  mkdir -p src/test
  if [ ! -f src/test/setup.ts ]; then
    cp "$PROJECT_ROOT/tooling/vite-react/configs/src/test/setup.ts" src/test/setup.ts
  fi

  log_step "Applying Auto-fixes"
  bun run lint:fix
  log_info "Lint autofix applied to scaffolded files"

  log_step "Setting Script Permissions"
  chmod +x scripts/*.sh
  log_info "Scripts made executable"

  log_step "Running Verification"
  if bash scripts/verify.sh; then
    log_info "All checks passed"
  else
    log_warn "Verification failed — check configs"
  fi

  log_step "SCENARIO READY: Vite React Tooling Test"
  log_info "Context: Golden configs from tooling/base + tooling/vite-react applied"
  log_info "Action:  Inspect configs, run 'bun run check' to verify"
}
