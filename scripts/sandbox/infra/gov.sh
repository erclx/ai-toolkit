#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"
source "$PROJECT_ROOT/scripts/lib/gov.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p install
  touch install/.gitkeep

  local src_rules="$PROJECT_ROOT/governance/rules"

  while IFS= read -r file; do
    local subdir
    subdir=$(rule_subdir "$file" "$src_rules")
    local rule
    rule=$(basename "$file" .mdc)
    local dest_dir="sync/.claude/rules"
    [ -n "$subdir" ] && dest_dir="sync/.claude/rules/$subdir"
    mkdir -p "$dest_dir"
    cp "$file" "$dest_dir/${rule}.md"
    echo "# stale" >>"$dest_dir/${rule}.md"
  done < <(find "$src_rules" -type f -name "*.mdc" | sort | head -n 2)

  while IFS= read -r file; do
    local subdir
    subdir=$(rule_subdir "$file" "$src_rules")
    local rule
    rule=$(basename "$file" .mdc)
    local dest_dir="build/.claude/rules"
    [ -n "$subdir" ] && dest_dir="build/.claude/rules/$subdir"
    mkdir -p "$dest_dir"
    cp "$file" "$dest_dir/${rule}.md"
  done < <(find "$src_rules" -type f -name "*.mdc" | sort)

  git add .
  git commit -m "chore(sandbox): scaffold gov test directories" --no-verify -q

  log_step "Governance sandbox"
  log_info "install/ : clean target, no rules present"
  log_info "sync/    : stale .claude/rules/ present"
  log_info "build/   : full .claude/rules/ present, generates .claude/.tmp/gov/rules.md"
  log_info "list     : read-only catalog dump, no target needed"

  select_or_route_scenario "Which scenario?" "install" "sync" "build" "list"

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk gov install astro --add 200-react install/"
    exec "$PROJECT_ROOT/scripts/gov/install.sh" astro --add 200-react install/
    ;;
  "sync")
    log_step "Running: aitk gov sync"
    exec "$PROJECT_ROOT/scripts/gov/sync.sh" sync/
    ;;
  "build")
    log_step "Running: aitk gov build"
    exec "$PROJECT_ROOT/scripts/gov/build.sh" build/
    ;;
  "list")
    log_step "Running: aitk gov list"
    exec "$PROJECT_ROOT/scripts/gov/list.sh"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
