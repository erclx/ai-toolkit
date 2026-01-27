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
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  log_step "Injecting Planner Context"

  rm -f src/components/header.tsx

  log_info "Context injected (Map + Law). 'header.tsx' removed to trigger planning."
}

stage_verify() {
  local log_file=$1
  local plan_file=".gemini/plan.md"
  
  log_step "Plan Verification"

  if [ ! -f "$plan_file" ]; then
    log_fail "Plan file missing: $plan_file"
    return 1
  fi

  if grep -qi "header" "$plan_file" || grep -qi "components" "$plan_file"; then
    log_info "Planner correctly identified missing UI component"
  else
    log_fail "Planner failed to suggest creating components"
    return 1
  fi

  if grep -qi "Rule" "$plan_file" || grep -qi "GEMINI.md" "$plan_file" || grep -qi "CQS" "$plan_file"; then
      log_info "Planner correctly linked tasks to Governance Rules (Deep Linking)"
  else
      log_fail "Planner failed to link tasks to GEMINI.md rules."
      return 1
  fi

  return 0
}