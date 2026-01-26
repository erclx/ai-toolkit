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
  log_step "Polluting Environment (Simulating Legacy State)"
  
  echo "node_modules/" > .gitignore
  echo ".DS_Store" >> .gitignore
  echo "dist/" >> .gitignore
  echo ".env" >> .gitignore

  echo "dist" > .prettierignore
  echo ".gemini/" >> .prettierignore

  rm -f .geminiignore

  log_info "Environment polluted: Messy .gitignore/.prettierignore created, .geminiignore deleted."
}

stage_verify() {
  local log_file=$1
  
  log_step "Verifying Ignore Architecture"

  if grep -q "# System" .gitignore && grep -q "# Deps" .gitignore; then
     log_info "Standardization: .gitignore contains correct headers."
  else
     log_fail "Standardization: .gitignore missing headers."
     return 1
  fi

  if [ -f .geminiignore ]; then
     if grep -q ".gemini/.tmp/" .geminiignore; then
        log_info "Context: .geminiignore created and excludes ghost folder."
     else
        log_fail "Context: .geminiignore missing ghost folder exclusion."
        return 1
     fi
  else
     log_fail "Artifact: .geminiignore was not created."
     return 1
  fi

  if [ -f .prettierignore ] && grep -q "# Build" .prettierignore; then
     log_info "Discovery: .prettierignore was found and standardized."
  else
     log_fail "Discovery: .prettierignore was ignored or not formatted."
     return 1
  fi

  return 0
}