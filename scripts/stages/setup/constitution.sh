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
  log_step "Clearing existing Governance"
  
  if [ -f "GEMINI.md" ]; then
    rm GEMINI.md
    log_info "Removed existing GEMINI.md"
  else
    log_info "No existing GEMINI.md found"
  fi
}

stage_verify() {
  local log_file=$1
  local const_file="GEMINI.md"
  
  log_step "Verifying Constitution ($const_file)"

  if [ ! -f "$const_file" ]; then
    log_fail "Artifact Missing: GEMINI.md was not created."
    return 1
  fi

  if grep -q "Zero-Bloat" "$const_file" && grep -q "YAGNI" "$const_file"; then
     log_info "Philosophy: Zen of Gemini (Zero-Bloat/YAGNI) detected."
  else
     log_fail "Philosophy: Missing core Zen rules."
     return 1
  fi

  if grep -q "Zero Comments" "$const_file"; then
     log_info "Style: Zero-Comment policy detected."
  else
     log_fail "Style: Zero-Comment policy missing."
     return 1
  fi

  if grep -q "├──" "$const_file" || grep -q "scout-report" "$const_file"; then
     log_fail "Separation of Concerns: Constitution contains a file tree (This belongs in the Scout Report!)."
     return 1
  else
     log_info "Separation of Concerns: No file trees detected (Correct)."
  fi

  return 0
}