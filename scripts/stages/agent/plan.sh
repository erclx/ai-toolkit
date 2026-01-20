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

stage_setup() {
  log_step "Mocking Planner Context"
  
  rm -f .gemini/PLAN.md
  mkdir -p .gemini

  cat <<EOF > .gemini/scout_report.md
# Scout Report
- Framework: Next.js (App Router)
- Language: TypeScript
- Database: Prisma
- State: Server Actions
EOF

  log_info "Cleaned previous plan & injected context"
}

stage_verify() {
  local log_file=$1
  local plan_file=".gemini/PLAN.md"
  local errors=0

  log_step "Verifying Living Document (.gemini/PLAN.md)"

  if [ ! -f "$plan_file" ]; then
    log_fail "Plan file missing: $plan_file"
    errors=$((errors + 1))
  else
    log_info "Plan file created successfully"
  fi

  if grep -qi "App Router" "$plan_file" 2>/dev/null; then
    log_info "Context Awareness: Found 'App Router'"
  else
    log_fail "Context Missing: 'App Router' not found in plan"
    errors=$((errors + 1))
  fi

  if grep -qi "Prisma" "$plan_file" 2>/dev/null; then
    log_info "Context Awareness: Found 'Prisma'"
  else
    log_fail "Context Missing: 'Prisma' not found in plan"
    errors=$((errors + 1))
  fi

  return $errors
}