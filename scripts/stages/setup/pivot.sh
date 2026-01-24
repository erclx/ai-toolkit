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
  log_step "Pre-Flight: Simulating Anchor State"
  
  mkdir -p .gemini/.tmp

  # Inject a Scout Report that confirms we are currently on Vite/React
  cat <<EOF > .gemini/.tmp/scout_report.md
# Scout Report
- Archetype: Vite React
- Framework: React 19
- Build: Vite
- Manager: bun
EOF
  log_info "Anchor Environment: Vite React + Bun confirmed"
}

stage_verify() {
  local log_file=$1
  
  log_step "Verifying Pivot Logic (Vite React -> Next.js)"

  if grep -q "rm vite.config.ts" "$log_file" && grep -q "rm.*index.html" "$log_file"; then
     log_info "Purge: Correctly identified Vite assets to delete"
  else
     log_fail "Purge: Failed to delete Vite configuration/assets"
     return 1
  fi

  if grep -q "bun add next" "$log_file" || grep -q "bun add.*next" "$log_file"; then
     log_info "Install: Added Next.js dependency"
  else
     log_fail "Install: Failed to add Next.js dependency"
     return 1
  fi

  if grep -q "src/app/page.tsx" "$log_file"; then
     log_info "Scaffold: Created Next.js App Router entry point"
  else
     log_fail "Scaffold: Failed to create src/app/page.tsx"
     return 1
  fi

  if grep -q "sed -i.*GEMINI.md" "$log_file"; then
     log_info "Identity: Updates GEMINI.md for Cursor context"
  else
     log_fail "Identity: Failed to update GEMINI.md"
     return 1
  fi

  return 0
}