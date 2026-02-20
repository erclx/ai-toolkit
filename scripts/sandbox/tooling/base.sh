#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Injecting Base Tooling Configs"
  inject_tooling_configs "base"

  log_step "Seeding CSpell Dictionary"
  mkdir -p .cspell
  cat <<'EOF' >>.cspell/tech-stack.txt
commitlint
scannability
shellcheck
shfmt
EOF
  log_info "Base terms added to .cspell/tech-stack.txt"

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

  log_step "Installing Dev Dependencies"
  bun add -D \
    prettier \
    cspell \
    husky \
    @commitlint/cli \
    @commitlint/config-conventional

  log_step "Initializing Husky"
  bunx husky

  log_step "Adding Package Scripts"
  node -e "
    const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
    pkg.scripts = {
      ...pkg.scripts,
      'check:spell': \"cspell '**' --no-progress --color --show-context\",
      'check:format': 'prettier --check --ignore-path .gitignore . && shfmt --diff --indent 2 **/*.sh',
      'check:shell': 'shellcheck --severity=warning **/*.sh',
      'format': 'prettier --write --ignore-path .gitignore . && shfmt --write --indent 2 **/*.sh',
      'prepare': 'husky',
      'check': './scripts/verify.sh',
      'clean': './scripts/clean.sh',
      'update': './scripts/update.sh'
    };
    require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  log_info "Package scripts configured"

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
