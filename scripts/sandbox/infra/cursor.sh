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
  inject_tooling_reference "vite-react" "."

  log_step "Scenario ready: Cursor IDE playground"
  log_info "Context: full governance rules + tooling references injected"
  log_info "Action:  open Cursor and try these prompts:"

  echo -e "${GREY}│${NC}" >&2
  log_info "1. UI test (Tailwind/React rules):"
  echo -e "${GREY}│${NC}    \"Create a shared StatusBadge component in src/components/. It should accept a variant prop (success, warning, error) and children. Use the cn utility.\"" >&2

  echo -e "${GREY}│${NC}" >&2
  log_info "2. Feature test (architecture rules):"
  echo -e "${GREY}│${NC}    \"Create a UserGreeting feature in src/features/dashboard. Display time of day and use the StatusBadge to show 'Online'.\"" >&2

  echo -e "${GREY}│${NC}" >&2
  log_info "3. Security test (Zod/env rules):"
  echo -e "${GREY}│${NC}    \"Add VITE_MAINTENANCE_MODE to env config with Zod validation. Trigger a full-screen error if true.\"" >&2
}
