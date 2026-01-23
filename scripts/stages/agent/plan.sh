#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_fail() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; }

use_anchor() {
  export ANCHOR_TYPE="vite-react"
}

stage_setup() {
  log_step "Injecting Planner Context"
  mkdir -p .gemini/.tmp
  cat <<EOF > .gemini/.tmp/scout_report.md
# Scout Report
- Archetype: Vite React
- Framework: React 18
- Language: TypeScript
- State: Local
EOF
  rm -f src/components/Header.tsx
  log_info "Context injected. 'Header.tsx' removed to trigger planning."
}

stage_verify() {
  local log_file=$1
  local plan_file=".gemini/plan.md"
  if [ ! -f "$plan_file" ]; then
    log_fail "Plan file missing: $plan_file"
    return 1
  fi
  log_step "Plan Verification"
  if grep -qi "Header" "$plan_file" || grep -qi "components" "$plan_file"; then
    log_info "Planner correctly identified missing UI component"
  else
    log_fail "Planner failed to suggest creating components"
    return 1
  fi
  return 0
}