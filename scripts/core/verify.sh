#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

NESTED="${VERIFY_NESTED:-false}"
WRITE="${VERIFY_WRITE:-true}"
SCOPED=true
CHANGED_FILES=""

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

print_usage() {
  echo "Usage: bun run check [--all]"
  echo "  --all   Run every stage instead of scoping shell, types, and tests to changed files"
  echo "  --help  Print this message"
}

parse_args() {
  local arg
  for arg in "$@"; do
    case "$arg" in
    --all) SCOPED=false ;;
    -h | --help)
      print_usage
      exit 0
      ;;
    *) log_error "Unknown argument: $arg" ;;
    esac
  done
}

# Union of the branch's committed diff, the working tree, and untracked files.
# A wider set only means running more stages, so every fallback widens.
collect_changed_files() {
  [ "$SCOPED" = true ] || return 0

  local base head local_baseline=false
  # origin/main, not local main. On main itself the local ref is HEAD, so a commit
  # not yet pushed would drop out of the changed set and skip the scoped stages.
  base=$(git -C "$PROJECT_ROOT" merge-base HEAD origin/main 2>/dev/null) || base=""
  if [ -z "$base" ]; then
    local_baseline=true
    base=$(git -C "$PROJECT_ROOT" merge-base HEAD main 2>/dev/null) || base=""
  fi
  if [ -z "$base" ]; then
    SCOPED=false
    log_warn "No merge base with main. Running every stage."
    return 0
  fi

  # Without a remote baseline, a merge base equal to HEAD hides committed work.
  if [ "$local_baseline" = true ]; then
    head=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null) || head=""
    if [ -z "$head" ] || [ "$base" = "$head" ]; then
      SCOPED=false
      log_warn "No pushed baseline to compare against. Running every stage."
      return 0
    fi
  fi

  CHANGED_FILES=$({
    git -C "$PROJECT_ROOT" diff --name-only "$base" HEAD
    git -C "$PROJECT_ROOT" diff --name-only HEAD
    git -C "$PROJECT_ROOT" ls-files --others --exclude-standard
  } | sort -u)
}

has_changed() {
  [ "$SCOPED" = true ] || return 0
  printf '%s\n' "$CHANGED_FILES" | grep -qE "$1"
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

# Whatever plugin and marketplace manifests the repo currently carries, so the
# stage picks up a new one without an edit here. Both listings honor .gitignore,
# which keeps linked worktrees and dependency copies out.
collect_plugin_manifests() {
  {
    git -C "$PROJECT_ROOT" ls-files -- '*.claude-plugin/plugin.json' '*.claude-plugin/marketplace.json'
    git -C "$PROJECT_ROOT" ls-files --others --exclude-standard -- '*.claude-plugin/plugin.json' '*.claude-plugin/marketplace.json'
  } | sort -u
}

assert_no_drift() {
  local paths=$1
  local err_msg=$2
  run_check "cd $PROJECT_ROOT && git diff --exit-code --quiet -- $paths" "$err_msg"
  run_check "cd $PROJECT_ROOT && [ -z \"\$(git ls-files --others --exclude-standard -- $paths)\" ]" "$err_msg"
}

main() {
  check_dependencies
  parse_args "$@"

  if [ "$NESTED" = false ]; then echo -e "${GREY}┌${NC}"; fi

  collect_changed_files

  if [ "$WRITE" = true ]; then
    echo -e "${GREY}├${NC} ${WHITE}Formatting${NC}"
    run_check "bun run format" "Format failed"
    log_info "Format applied"
  else
    echo -e "${GREY}├${NC} ${WHITE}Format check${NC}"
    run_check "bun run check:format" "Format check failed"
    log_info "Format check passed"
  fi

  log_step "Indexes"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-indexes.sh" "Index regen failed"
  assert_no_drift "'*index.md'" "Indexes drifted. Run bun run check and commit the updated index files."
  log_info "Indexes clean"

  log_step "Consumed copies"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-claude-copies.sh" "Consumed-copy regen failed"
  assert_no_drift ".claude/standards .claude/snippets" "Consumed copies drifted. Run bun run check and commit .claude/standards and .claude/snippets."
  log_info "Consumed copies clean"

  log_step "Skill references"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-skill-references.sh" "Skill-reference regen failed"
  assert_no_drift "claude/skills/*/references" "Skill references drifted. Run bun run check and commit the updated reference files."
  log_info "Skill references clean"

  log_step "Skill paths"
  run_check "bash $PROJECT_ROOT/scripts/core/check-skill-paths.sh" "Shipped skills reference a repo-local path."
  log_info "Skill paths clean"

  log_step "Plugin manifests"
  if ! command -v claude >/dev/null 2>&1; then
    log_info "Skipped, claude is not installed"
  else
    local manifests manifest
    manifests=$(collect_plugin_manifests)
    if [ -z "$manifests" ]; then
      log_info "Skipped, no manifests present"
    else
      while IFS= read -r manifest; do
        run_check "cd $PROJECT_ROOT && claude plugin validate --strict '$manifest'" "Manifest validation failed: $manifest"
      done <<<"$manifests"
      log_info "Manifests valid"
    fi
  fi

  log_step "Spelling"
  run_check "bun run check:spell" "Spell check failed"
  log_info "Spell check passed"

  log_step "Shell"
  if has_changed '\.sh$|^package\.json$'; then
    run_check "bun run check:shell" "Shell check failed"
    log_info "Shell check passed"
  else
    log_info "Skipped, no shell changes"
  fi

  log_step "Types"
  if has_changed '^src/|^tsconfig\.json$|^package\.json$'; then
    run_check "bun run check:types" "Typecheck failed"
    log_info "Typecheck passed"
  else
    log_info "Skipped, no TypeScript changes"
  fi

  log_step "Tests"
  if has_changed '^src/|^vitest\.config\.ts$|^tsconfig\.json$|^package\.json$'; then
    run_check "bun run test" "Tests failed"
    log_info "Tests passed"
  else
    log_info "Skipped, no TypeScript changes"
  fi

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Verification passed${NC}"
  fi
}

main "$@"
