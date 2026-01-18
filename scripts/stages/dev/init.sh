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
  log_step "Staging Environment"
  
  echo 'console.log("Senior Code")' > index.js
  echo '# My Project' > README.md
  
  : > .gitignore
  : > .geminiignore
  
  rm -rf .gemini
  
  log_info "Environment staged with manifest files"
}

stage_verify() {
  local errors=0

  log_step "Verifying Ghost Folder Infrastructure"

    if [ -d ".gemini/.tmp" ]; then
    log_info "SUCCESS: .gemini/.tmp directory created."
    else
    log_fail "FAILURE: .gemini/.tmp directory missing."
    errors=$((errors + 1))
    fi

  if [ -f .gitignore ] && grep -qF ".gemini/.tmp/" .gitignore; then
    log_info "SUCCESS: .gitignore updated."
  else
    log_fail "FAILURE: .gitignore update failed."
    errors=$((errors + 1))
  fi

  if [ -f .geminiignore ] && grep -qF ".gemini/.tmp/" .geminiignore; then
    log_info "SUCCESS: .geminiignore updated."
    else
    log_fail "FAILURE: .geminiignore update failed."
    errors=$((errors + 1))
  fi

  local line_count
  line_count=$(grep -c ".gemini/.tmp/" .gitignore 2>/dev/null || echo 0)
  if [ "$line_count" -gt 1 ]; then
    log_fail "FAILURE: Idempotency breach (Duplicate entries: $line_count)."
    errors=$((errors + 1))
  fi

  if [ -f ".gemini/.tmp/.gitkeep" ]; then
    log_info "SUCCESS: .gitkeep secured."
    fi

  return $errors
}