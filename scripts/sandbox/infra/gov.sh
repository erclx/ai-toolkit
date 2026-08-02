#!/usr/bin/env bash
set -e
set -o pipefail

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
    rule=$(basename "$file" .md)
    local dest_dir="sync/.claude/rules"
    [ -n "$subdir" ] && dest_dir="sync/.claude/rules/$subdir"
    mkdir -p "$dest_dir"
    cp "$file" "$dest_dir/${rule}.md"
    echo "# stale" >>"$dest_dir/${rule}.md"
  done < <(find "$src_rules" -type f -name "*.md" | sort | head -n 2)

  while IFS= read -r file; do
    local subdir
    subdir=$(rule_subdir "$file" "$src_rules")
    local rule
    rule=$(basename "$file" .md)
    local dest_dir="build/.claude/rules"
    [ -n "$subdir" ] && dest_dir="build/.claude/rules/$subdir"
    mkdir -p "$dest_dir"
    cp "$file" "$dest_dir/${rule}.md"
  done < <(find "$src_rules" -type f -name "*.md" | sort)

  # `regen/` is the one arm shaped like the toolkit rather than like a target,
  # because `gov regen` produces a repository's own consumed copy and refuses
  # nothing. It needs a stack catalog, a record, and an internal rule to reach
  # every branch the producer has.
  mkdir -p regen/internal/rules/claude regen/.claude/rules/claude
  cp -R "$PROJECT_ROOT/governance" regen/governance

  cat >regen/internal/governance.toml <<'TOML'
stack = "node"
add = ["300-testing-ts"]
TOML

  cat >regen/internal/rules/claude/599-sandbox-local.md <<'RULE'
# Sandbox-local rule

## Authority

- Authored under `internal/rules/`, so it reaches this repository and no target.
RULE

  # A destination-only file the regen must delete, and a drifted copy it must
  # overwrite. Together they are the before state the run is judged against.
  echo "# orphan, no source anywhere" >regen/.claude/rules/claude/999-orphan.md
  mkdir -p regen/.claude/rules/core
  cp "$src_rules/core/000-constitution.md" regen/.claude/rules/core/000-constitution.md
  echo "# stale" >>regen/.claude/rules/core/000-constitution.md

  git add .
  git commit -m "chore(sandbox): scaffold gov test directories" --no-verify -q

  log_step "Governance sandbox"
  log_info "install/ : clean target, no rules present"
  log_info "sync/    : stale .claude/rules/ present"
  log_info "build/   : full .claude/rules/ present, generates .claude/.tmp/gov/rules.md"
  log_info "list     : read-only catalog dump, no target needed"
  log_info "regen/   : toolkit-shaped root, orphan and drifted rule present"

  select_or_route_scenario "Which scenario?" "install" "sync" "build" "list" "regen"

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk gov install astro --add 200-react install/"
    exec bun "$PROJECT_ROOT/src/cli.ts" gov install astro --add 200-react install/
    ;;
  "sync")
    log_step "Running: aitk gov sync"
    exec bun "$PROJECT_ROOT/src/cli.ts" gov sync sync/
    ;;
  "build")
    log_step "Running: aitk gov build"
    exec bun "$PROJECT_ROOT/src/cli.ts" gov build build/
    ;;
  "list")
    log_step "Running: aitk gov list"
    exec "$PROJECT_ROOT/scripts/gov/list.sh"
    ;;
  "regen")
    log_step "Running: aitk gov regen --root regen/"
    # The command prints nothing on success, so the tree after it is the whole
    # result. Listed rather than exec'd for that reason.
    bun "$PROJECT_ROOT/src/cli.ts" gov regen --root regen/
    log_step "Produced regen/.claude/rules"
    find regen/.claude/rules -type f -name "*.md" | sort | sed "s|^regen/.claude/rules/||"
    log_info "599-sandbox-local.md present, 999-orphan.md gone, 000-constitution.md restored"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
