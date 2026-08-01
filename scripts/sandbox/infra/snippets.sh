#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p install
  touch install/.gitkeep
  mkdir -p sync/.claude/snippets

  local src_snippets="$PROJECT_ROOT/snippets"

  while IFS= read -r file; do
    local rel parent
    rel="${file#"$src_snippets/"}"
    parent=$(dirname "sync/.claude/snippets/$rel")
    mkdir -p "$parent"
    cp "$file" "sync/.claude/snippets/$rel"
  done < <(find "$src_snippets" -type f -name "*.md" | sort)

  local root_snippet nested_snippet
  root_snippet=$(find "$src_snippets" -maxdepth 1 -type f -name "*.md" | sort | head -n 1)
  nested_snippet=$(find "$src_snippets" -mindepth 2 -type f -name "*.md" | sort | head -n 1)
  echo "<!-- stale -->" >>"sync/.claude/snippets/${root_snippet#"$src_snippets/"}"
  echo "<!-- stale -->" >>"sync/.claude/snippets/${nested_snippet#"$src_snippets/"}"
  echo "# project local" >"sync/.claude/snippets/project-only.md"

  git add .
  git commit -m "chore(sandbox): scaffold snippets test directories" --no-verify -q

  log_step "Snippets sandbox"
  log_info "install/    : clean target, installs base category"
  log_info "essentials/ : clean target, installs essentials preset"
  log_info "sync/       : stale .claude/snippets/ present, plus one project-local snippet"
  log_info "create      : runs against toolkit source directly"
  log_info "list        : read-only catalog dump, no target needed"

  select_or_route_scenario "Which scenario?" "install" "essentials" "sync" "create" "list"

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk snippets install base"
    exec bun "$PROJECT_ROOT/src/cli.ts" snippets install base install/
    ;;
  "essentials")
    mkdir -p essentials
    log_step "Running: aitk snippets install essentials"
    exec bun "$PROJECT_ROOT/src/cli.ts" snippets install essentials essentials/
    ;;
  "sync")
    log_step "Running: aitk snippets sync"
    exec bun "$PROJECT_ROOT/src/cli.ts" snippets sync sync/
    ;;
  "create")
    log_step "Running: aitk snippets create"
    exec "$PROJECT_ROOT/scripts/snippets/create.sh"
    ;;
  "list")
    log_step "Running: aitk snippets list"
    exec bun "$PROJECT_ROOT/src/cli.ts" snippets list
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
