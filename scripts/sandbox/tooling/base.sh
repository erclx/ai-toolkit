#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Initializing Package"
  cat <<'EOF' >package.json
{
  "name": "sandbox-base-tooling",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF
  log_info "package.json created"

  log_step "Injecting Base Tooling Configs"
  inject_tooling_configs "base" "."

  log_step "Applying Base Tooling Manifest"
  inject_tooling_manifest "base" "."

  log_step "Initializing Husky"
  bunx husky

  log_step "Setting Script Permissions"
  chmod +x scripts/*.sh
  log_info "Scripts made executable"

  log_step "Running Verification"
  if bash scripts/verify.sh; then
    log_info "All checks passed"
  else
    log_warn "Verification failed — check configs"
  fi

  log_step "SCENARIO READY: Base Tooling Test"
  log_info "Context: Golden configs from tooling/base applied"
  log_info "Action:  Inspect configs, run 'bun run check' to verify"
}
