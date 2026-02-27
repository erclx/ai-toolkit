#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  log_step "Initializing Package"
  cat <<'EOF' >package.json
{
  "name": "sandbox-claude-workflow",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF
  log_info "package.json created"

  cat <<'EOF' >.gitignore
node_modules/
EOF
  log_info ".gitignore created"

  log_step "Running claude init"
  "$PROJECT_ROOT/scripts/manage-claude.sh" init "."

  log_step "SCENARIO READY: Claude Workflow Init"
  log_info "Context: Empty project with .claude/ seeded and FEATURES/ scaffolded"
  log_info "Verify:  .claude/CLAUDE.md, TASKS.md, REQUIREMENTS.md, ARCHITECTURE.md exist"
  log_info "Verify:  .claude/FEATURES/ and .claude/FEATURES/done/ exist"
  log_info "Verify:  .claude/PROJECT.md is in .gitignore"
}
