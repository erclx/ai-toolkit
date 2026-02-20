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
  inject_tooling_configs "vite-react"

  log_step "Installing Dev Dependencies"
  bun add -D \
    prettier \
    cspell \
    husky \
    @commitlint/cli \
    @commitlint/config-conventional \
    "eslint@^9" \
    eslint-config-prettier \
    eslint-plugin-check-file \
    eslint-plugin-react-hooks \
    eslint-plugin-react-refresh \
    eslint-plugin-simple-import-sort \
    eslint-plugin-vitest \
    globals \
    typescript-eslint \
    @eslint/js \
    typescript \
    @types/react \
    @types/react-dom \
    @types/node \
    vitest \
    @vitest/coverage-v8 \
    @vitest/ui \
    jsdom \
    @testing-library/react \
    @testing-library/jest-dom \
    @testing-library/user-event \
    @playwright/test \
    vite \
    @vitejs/plugin-react \
    tailwindcss \
    @tailwindcss/vite \
    prettier-plugin-tailwindcss

  log_step "Initializing Husky"
  bunx husky

  log_step "Scaffolding Test Setup"
  mkdir -p src/test
  if [ ! -f src/test/setup.ts ]; then
    cp "$PROJECT_ROOT/tooling/vite-react/configs/src/test/setup.ts" src/test/setup.ts
  fi

  log_step "Adding Package Scripts"
  node -e "
    const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
    pkg.scripts = {
      ...pkg.scripts,
      'dev': 'vite',
      'build': 'tsc -b && vite build',
      'preview': 'vite preview',
      'lint': 'eslint . --max-warnings 0',
      'lint:fix': 'eslint . --fix --max-warnings 0',
      'typecheck': 'tsc --noEmit',
      'test': 'vitest',
      'test:run': 'vitest run --reporter=verbose',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest run --coverage',
      'test:e2e': 'playwright test',
      'test:e2e:ui': 'playwright test --ui',
      'test:e2e:report': 'playwright show-report',
      'check:spell': \"cspell '**' --no-progress --color --show-context\",
      'check:format': 'prettier --check --ignore-path .gitignore . && shfmt --diff --indent 2 **/*.sh',
      'check:shell': 'shellcheck --severity=warning **/*.sh',
      'format': 'prettier --write --ignore-path .gitignore . && shfmt --write --indent 2 **/*.sh',
      'prepare': 'husky',
      'check': './scripts/verify.sh',
      'check:full': './scripts/verify.sh && bun run test:e2e'
    };
    require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  log_info "Package scripts configured"

  log_step "Scaffolding Verify Script"
  mkdir -p scripts
  scaffold_vite_verify_script
  chmod +x scripts/verify.sh

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

scaffold_vite_verify_script() {
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

  log_step "1. Type Check"
  run_check "bun run typecheck" "Type check failed"
  log_info "Type check passed"

  log_step "2. Lint"
  run_check "bun run lint" "Lint failed"
  log_info "Lint passed"

  log_step "3. Formatting"
  run_check "bun run check:format" "Format check failed"
  log_info "Format check passed"

  log_step "4. Spelling"
  run_check "bun run check:spell" "Spell check failed"
  log_info "Spell check passed"

  log_step "5. Unit Tests"
  run_check "bun run test:run" "Unit tests failed"
  log_info "Unit tests passed"

  log_step "6. Build"
  run_check "bun run build" "Build failed"
  log_info "Build passed"

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Verification passed${NC}"
  fi
}

main "$@"
SCRIPT
}
