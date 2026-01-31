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
  

  echo ".git/" > .geminiignore
   
  log_info "Environment staged with manifest files & pre-seeded ignore"
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

  if [ -f ".gemini/settings.json" ]; then
    log_info "SUCCESS: .gemini/settings.json created."
  else
    log_fail "FAILURE: .gemini/settings.json missing."
    errors=$((errors + 1))
  fi

  if [ -f .gitignore ]; then
    if grep -qF ".gemini/" .gitignore; then
      log_info "SUCCESS: .gitignore ignores .gemini/"
    else
      log_fail "FAILURE: .gitignore missing .gemini/ ignore"
    errors=$((errors + 1))
  fi

    if grep -qF "!.gemini/settings.json" .gitignore; then
      log_info "SUCCESS: .gitignore whitelists settings.json"
    else
      log_fail "FAILURE: .gitignore missing whitelist rule"
      errors=$((errors + 1))
    fi
  fi

  if [ -f .geminiignore ]; then
    if grep -qF ".gemini/.tmp/" .geminiignore; then
      log_info "SUCCESS: .geminiignore ignores .tmp (Brain Isolation)"
    else
      log_fail "FAILURE: .geminiignore missing .tmp ignore"
      errors=$((errors + 1))
    fi

    if grep -qF ".git/" .geminiignore; then
      log_info "SUCCESS: Pre-existing .git/ entry preserved."
    else
      log_fail "FAILURE: Pre-existing .git/ entry was lost!"
      errors=$((errors + 1))
    fi
  fi

  local line_count
  line_count=$(grep -c ".gemini/" .gitignore 2>/dev/null || echo 0)
  if [ "$line_count" -gt 1 ]; then
    log_fail "FAILURE: Idempotency breach (Duplicate entries: $line_count)."
    errors=$((errors + 1))
    fi

  return $errors
}