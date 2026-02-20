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

  log_step "Seeding CSpell Dictionary"
  mkdir -p .cspell
  cat <<'EOF' >>.cspell/tech-stack.txt
scannability
shfmt
shellcheck
tolower
toupper
Vite
EOF
  log_info "Anchor terms added to .cspell/tech-stack.txt"

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
      'clean': './scripts/clean.sh',
      'update': './scripts/update.sh',
      'check:full': './scripts/verify.sh && bun run test:e2e'
    };
    require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  log_info "Package scripts configured"

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
