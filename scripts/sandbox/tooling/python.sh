#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  if ! command -v uv >/dev/null 2>&1; then
    log_error "uv is not installed. Install from https://docs.astral.sh/uv/"
  fi

  log_step "Scaffolding python (uv init --app --python 3.13)"
  uv init --app --python 3.13 --name sandbox-python --no-readme . >/dev/null
  log_info "uv init complete"

  log_step "Seeding package.json (bun init -y)"
  bun init -y >/dev/null 2>&1
  log_info "package.json created"

  log_step "Applying base configs and seeds"
  inject_tooling_configs "base" "."
  inject_tooling_seeds "base" "."

  log_step "Applying python configs and seeds"
  inject_tooling_configs "python" "."
  inject_tooling_seeds "python" "."

  log_step "Injecting manifests (base + python)"
  inject_tooling_manifest "base" "."
  inject_tooling_manifest "python" "."

  log_step "Initializing Husky"
  bunx husky

  log_step "Setting script permissions"
  chmod +x scripts/*.sh
  log_info "Scripts made executable"

  log_step "Installing python tooling deps"
  log_info "Manifest does not declare these because inject hardcodes 'bun add -D'"
  uv add --dev ruff mypy pytest pytest-cov >/dev/null 2>&1
  log_info "ruff, mypy, pytest, pytest-cov added"

  log_step "Syncing python venv"
  uv sync >/dev/null 2>&1
  log_info "uv sync complete"

  log_step "Annotating scaffold main()"
  if [ -f main.py ]; then
    sed -i 's/^def main():/def main() -> None:/' main.py
    log_info "main.py annotated"
  fi

  log_step "Running lint:fix"
  if bun run lint:fix >/dev/null 2>&1; then
    log_info "Auto-fix applied"
  else
    log_warn "lint:fix had issues"
  fi

  log_step "Running verification"
  if bash scripts/verify.sh; then
    log_info "All checks passed"
  else
    log_warn "Verification failed, check configs"
  fi

  log_step "Scenario ready: python tooling test"
  log_info "Context: golden configs from tooling/base + tooling/python applied"
  log_info "Action:  inspect configs, run 'bun run check' to verify"
}
