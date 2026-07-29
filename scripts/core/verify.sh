#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

NESTED="${VERIFY_NESTED:-false}"

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

run_check() {
  local cmd=$1
  local err_msg=$2
  local output
  if ! output=$(eval "$cmd" 2>&1); then
    echo "$output" | pipe_output
    log_error "$err_msg"
  fi
  echo "$output" | pipe_output
}

main() {
  check_dependencies

  if [ "$NESTED" = false ]; then echo -e "${GREY}┌${NC}"; fi

  echo -e "${GREY}├${NC} ${WHITE}Formatting${NC}"
  run_check "bun run format" "Format failed"
  log_info "Format applied"

  log_step "Format check"
  run_check "bun run check:format" "Format check failed"
  log_info "Format check passed"

  log_step "Indexes"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-indexes.sh" "Index regen failed"
  run_check "cd $PROJECT_ROOT && git diff --exit-code --quiet -- '*index.md'" "Indexes drifted. Run bun run check and commit the updated index files."
  log_info "Indexes clean"

  log_step "Consumed copies"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-claude-copies.sh" "Consumed-copy regen failed"
  run_check "cd $PROJECT_ROOT && git diff --exit-code --quiet -- .claude/standards .claude/snippets" "Consumed copies drifted. Run bun run check and commit .claude/standards and .claude/snippets."
  log_info "Consumed copies clean"

  log_step "Skill references"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-skill-references.sh" "Skill-reference regen failed"
  run_check "cd $PROJECT_ROOT && git diff --exit-code --quiet -- claude/skills/*/references" "Skill references drifted. Run bun run check and commit the updated reference files."
  log_info "Skill references clean"

  log_step "Spelling"
  run_check "bun run check:spell" "Spell check failed"
  log_info "Spell check passed"

  log_step "Shell"
  run_check "bun run check:shell" "Shell check failed"
  log_info "Shell check passed"

  # Runs before the tests because a missing import is caught in a second here
  # and only shows up in the suite where a test happens to cover the caller.
  log_step "Types"
  run_check "bun run check:types" "Typecheck failed"
  log_info "Typecheck passed"

  log_step "Tests"
  run_check "bun run test" "Tests failed"
  log_info "Tests passed"

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Verification passed${NC}"
  fi
}

main "$@"
