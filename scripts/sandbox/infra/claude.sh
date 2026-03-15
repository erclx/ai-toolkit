#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_GOV="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-claude-infra",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  git add .
  git commit -m "chore(sandbox): scaffold claude infra test directory" --no-verify -q

  log_step "Claude sandbox"
  log_info "init   — seeds .claude/ workflow docs"
  log_info "sync   — diffs and updates managed role prompts"
  log_info "prompt — generates master prompts from installed rules"

  select_option "Which scenario?" "init" "sync" "prompt"

  case "$SELECTED_OPTION" in
  "init")
    log_step "Running: aitk claude init"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" init .
    ;;
  "sync")
    log_step "Running: aitk claude sync"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" sync .
    ;;
  "prompt")
    log_step "Running: aitk claude init"
    "$PROJECT_ROOT/scripts/manage-claude.sh" init .
    log_step "Running: aitk claude prompt"
    exec "$PROJECT_ROOT/scripts/claude/prompt.sh"
    ;;
  esac
}
