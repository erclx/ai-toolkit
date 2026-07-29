#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p install
  touch install/.gitkeep
  mkdir -p sync/.claude/standards

  local src_standards="$PROJECT_ROOT/standards"

  while IFS= read -r file; do
    cp "$file" "sync/.claude/standards/$(basename "$file")"
  done < <(find "$src_standards" -maxdepth 1 -type f -name "*.md" | sort)

  local drifted
  drifted=$(find "$src_standards" -maxdepth 1 -type f -name "*.md" -not -name "index.md" | sort | head -n 2)
  while IFS= read -r file; do
    echo "<!-- stale -->" >>"sync/.claude/standards/$(basename "$file")"
  done <<<"$drifted"

  printf -- '---\ntitle: Project own\ndescription: A standard this project authored\n---\n\n# Project own\n' \
    >"sync/.claude/standards/project-own.md"
  echo "<!-- stale index -->" >>"sync/.claude/standards/index.md"

  git add .
  git commit -m "chore(sandbox): scaffold standards test directories" --no-verify -q

  log_step "Standards sandbox"
  log_info "install/ : clean target, no standards present"
  log_info "sync/    : two drifted standards, a project-authored one, a stale index"
  log_info "           headless runs refuse to apply, since standards are seeds projects edit"
  log_info "list     : read-only catalog dump, no target needed"

  select_or_route_scenario "Which scenario?" "install" "sync" "list"

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk standards install"
    exec bun "$PROJECT_ROOT/src/cli.ts" standards install install/
    ;;
  "sync")
    log_step "Running: aitk standards sync"
    exec bun "$PROJECT_ROOT/src/cli.ts" standards sync sync/
    ;;
  "list")
    log_step "Running: aitk standards list"
    "$PROJECT_ROOT/scripts/standards/list.sh"
    log_step "Running: aitk standards list --json | jq '.standards[0] | keys'"
    "$PROJECT_ROOT/scripts/standards/list.sh" --json | jq '.standards[0] | keys'
    log_info "Expect keys: description, name, target, content"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
