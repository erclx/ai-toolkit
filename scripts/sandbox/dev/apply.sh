#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  inject_governance
  inject_dependencies

  log_step "SCENARIO READY: CLI Automation Test"
  log_info "Context: Governance rules injected. React environment ready."
  log_info "Step 1:  gemini gov:prompt"
  log_info "Step 2:  gemini dev:apply-cli \"Create a shared StatusBadge component with success/warning/error variants using tailwind\""
  log_info "Expect:  Agent creates 'src/components/status-badge.tsx', runs lint/build, and reports success."
}
