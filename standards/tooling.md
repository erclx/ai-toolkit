# TOOLING BASE REFERENCE

## Runtime

- Use `bun` as package manager and script runner.
- Use `bunx` instead of `npx` for one-off executables.

## Prettier

- Config: `.prettierrc` (JSON) at root.
- Rules: `semi: false`, `singleQuote: true`.
- Add parser overrides for non-standard extensions (e.g., `.mdc` → `markdown`).
- Ignore paths via `.gitignore` — do not create `.prettierignore`.

## Dev Dependencies

- `prettier`, `cspell`, `husky`, `@commitlint/cli`, `@commitlint/config-conventional`.
- Install via `bun add -D`.
- Ensure `.gitignore` contains `node_modules/`.

## CSpell

- Config: `cspell.json` at root.
- Include `version: "0.2"` and `language: "en"`.
- Set `useGitignore: true` to skip ignored paths.
- Dictionary files in `.cspell/`: `project-terms.txt`, `tech-stack.txt`.
- Set `addWords: true` on each dictionary definition.
- Add `ignorePaths: [".cspell/**"]` to avoid self-checking dictionaries.
- Keep dictionary entries sorted alphabetically, one word per line.

## Shell Tooling

- Lint: `shellcheck` with `--severity=warning`.
- Format: `shfmt` with `--indent 2`.
- Config: `.shellcheckrc` with `external-sources=true`.
- Project `.vscode/settings.json` with `"shellcheck.customArgs": ["--severity=warning"]` (no CLI config equivalent).

## Commit Lint

- Config: `commitlint.config.js` (ESM default export).
- Extends: `@commitlint/config-conventional`.
- Rules: `header-max-length: 72`, `scope-case: lower-case`, `subject-full-stop: never`, `subject-case: disabled`.
- Format: `<type>(<scope>): <subject>` — imperative mood, no trailing period.

## Husky + Lint-Staged

- Config: `.lintstagedrc` (JSON) at root.
- Hooks in `.husky/`:
  - `pre-commit` → `bunx lint-staged`
  - `commit-msg` → `bunx commitlint --edit "$1"`
  - `pre-push` → `bun run check`
- Lint-staged globs:
  - `**/*.{json,md,mdc}` → `["prettier --write --ignore-path .gitignore", "cspell --no-must-find-files"]`
  - `**/*.sh` → `["shfmt --write --indent 2", "shellcheck --severity=warning"]`

## Scripts

- Entry: `scripts/` directory with `verify.sh`, `clean.sh`, `update.sh`.
- All scripts use logging functions from the bash script reference.
- `verify.sh` supports `--nested` flag to suppress timeline boundaries when called by other scripts.
- `update.sh` calls `verify.sh --nested` after interactive dependency update.

### verify.sh

```sh
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
  command -v shellcheck >/dev/null 2>&1 || log_error "shellcheck is not installed"
  command -v shfmt >/dev/null 2>&1 || log_error "shfmt is not installed"
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
  run_check "bun run check:spell" "Spell check failed"
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
```

### clean.sh

```sh
#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_rem() { echo -e "${GREY}│${NC} ${RED}-${NC} $1"; }

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

main() {
  check_dependencies
  echo -e "${GREY}┌${NC}"

  log_step "Cleaning Artifacts"
  rm -rf node_modules
  log_rem "node_modules/"

  log_step "Cleaning Cache"
  bun pm cache rm
  log_info "Package manager cache cleared"

  log_step "Rehydrating Project"
  bun install
  log_info "Dependencies installed"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Success!${NC}"
}

main "$@"
```

### update.sh

```sh
#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
pipe_output() { while IFS= read -r line; do echo -e "${GREY}│${NC}  $line"; done; }

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

main() {
  check_dependencies
  echo -e "${GREY}┌${NC}"

  log_step "Interactive Dependency Update"
  echo -e "${GREY}│${NC}"
  bun update --interactive 2>&1 | pipe_output

  log_step "Verifying Project Health"
  if [ -f "./scripts/verify.sh" ]; then
    ./scripts/verify.sh --nested
    log_info "All checks passed"
  else
    log_warn "Verification script not found, skipping."
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Update Complete.${NC}"
}

main "$@"
```

## VS Code Extensions

- `esbenp.prettier-vscode`, `streetsidesoftware.code-spell-checker`
- `mkhl.shfmt`, `timonwong.shellcheck`, `mads-hartmann.bash-ide-vscode`

## Package Scripts

- `check:spell` — cspell all files with context output.
- `check:format` — prettier check + shfmt diff.
- `check:shell` — shellcheck all `.sh` files.
- `format` — prettier write + shfmt write.
- `prepare` — husky install.
- `check` — runs `scripts/verify.sh`.
- `clean` — runs `scripts/clean.sh`.
- `update` — runs `scripts/update.sh`.
