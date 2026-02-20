#!/bin/bash
set -e
set -o pipefail

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Injecting Base Tooling Configs"
  inject_tooling_configs "base"

  log_step "Installing Dev Dependencies"
  bun add -D \
    prettier \
    cspell \
    husky \
    @commitlint/cli \
    @commitlint/config-conventional

  log_step "Initializing Husky"
  bunx husky

  log_step "Scaffolding Verify Scripts"
  mkdir -p scripts
  cp "$PROJECT_ROOT/tooling/base/configs/scripts/verify.sh" scripts/verify.sh 2>/dev/null || scaffold_verify_script
  chmod +x scripts/verify.sh

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
      'check': './scripts/verify.sh'
    };
    require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  log_info "Package scripts configured"

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

scaffold_verify_script() {
  cat <<'SCRIPT' >scripts/verify.sh
#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

NESTED=false
[[ "${1:-}" == "--nested" ]] && NESTED=true

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
pipe_output() { while IFS= read -r line; do echo -e "${GREY}│${NC}  $line"; done; }

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

run_check() {
  local cmd=$1
  local err_msg=$2
  if ! eval "$cmd" 2>&1 | pipe_output; then
    log_error "$err_msg"
  fi
}

main() {
  check_dependencies
  if [ "$NESTED" = false ]; then echo -e "${GREY}┌${NC}"; fi

  log_step "1. Formatting"
  run_check "bun run check:format" "Format check failed"
  log_info "Format check passed"

  log_step "2. Spelling"
  run_check "bun run check:spell" "Spell check passed"
  log_info "Spell check passed"

  log_step "3. Shell"
  run_check "bun run check:shell" "Shell check failed"
  log_info "Shell check passed"

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Verification passed${NC}"
  fi
}

main "$@"
SCRIPT
}
