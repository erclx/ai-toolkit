#!/bin/bash
set -e
set -o pipefail

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Creating Mock Target Project"

  mkdir -p mock-project/.cursor/rules
  mkdir -p mock-project/standards

  cat <<'EOF' >mock-project/.cursor/rules/drifted-rule.mdc
---
description: Outdated Governance Rule
globs: *
---
# Outdated Rule
This rule has drifted from the central repository and needs to be synced.
EOF

  log_step "Staging Mock Project"
  git add mock-project/
  git commit -m "feat(infra): add sync scenario with drifted rules" -q

  log_info "Mock project committed to sandbox history"

  log_step "SCENARIO READY: Governance Sync"
  log_info "Context: A mock project exists with missing and drifted governance files."
  log_info "Action:  Run 'gdev sync mock-project'"
  log_info "Expect:  The CLI will detect differences and prompt to apply updates."
}
