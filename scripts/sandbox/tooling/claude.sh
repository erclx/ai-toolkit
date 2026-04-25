#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  log_step "Initializing package"
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

  log_step "Injecting governance rules"
  "$PROJECT_ROOT/scripts/manage-gov.sh" install base "."
  log_info "Base rules injected into .claude/rules/"

  log_step "Scenario ready: Claude workflow"
  log_info "Context: Empty project with base gov rules injected"
  log_info ""
  log_info "Test sequence:"
  log_info "  1. aitk claude init        : seed .claude/ and verify DESIGN.md prompt"
  log_info "  2. aitk claude sync        : verify PLANNER.md diff and sync"
  log_info "  3. aitk claude prompt      : verify .claude/.tmp/roles/IMPLEMENTER.md generated"
  log_info ""
  log_info "Verify after init:"
  log_info "  .claude/PLANNER.md, TASKS.md, REQUIREMENTS.md, ARCHITECTURE.md, WIREFRAMES.md exist"
  log_info "  .claude/DESIGN.md exists only if UI was selected"
  log_info "  .gitignore contains .claude/.tmp/"
  log_info ""
  log_info "Verify after prompt:"
  log_info "  .claude/.tmp/roles/IMPLEMENTER.md contains injected rules and TASKS, REQUIREMENTS, ARCHITECTURE content"
}
