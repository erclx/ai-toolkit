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
  log_step "Setting up Changelog Environment"

  cat <<'EOF' > CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added

- **Core:** Initial release of the system.
EOF
  
  git add CHANGELOG.md
  git commit -m "chore(docs): init changelog" -q
  git tag v1.0.0

  touch auth.js
  git add auth.js
  git commit -m "feat(api): added login page" -q
  
  touch api.js
  git add api.js
  git commit -m "fix(api): bug in api" -q
  
  echo "node_modules" >> .gitignore
  git add .gitignore
  git commit -m "chore(gitignore): update gitignore rules" -q
  
  log_info "Environment ready: v1.0.0 + Feature + Fix + Noise"
}

stage_verify() {
  local log_file=$1
  local target_file="CHANGELOG.md"
   
  log_step "Verifying Changelog Auditor"

  if [ ! -f "$target_file" ]; then
    log_fail "Target file missing: $target_file"
    return 1
  fi

  local violations=0
  
  if grep -q "Initial release of the system" "$target_file"; then
      log_info "Integrity: Ancient history preserved."
  else
      log_fail "Integrity: History lost! The Stitching logic overwrote the tail."
      violations=$((violations + 1))
  fi

  if grep -Pq "[\x{1F600}-\x{1F64F}]" "$target_file" 2>/dev/null; then
      log_fail "Failure: Emojis detected in changelog."
      violations=$((violations + 1))
  fi

  if ! grep -q "\*\*.*:\*\*" "$target_file"; then
      log_fail "Failure: No Bold Scopes (e.g., '**Auth:**') found."
      violations=$((violations + 1))
  fi

  if grep -qi "gitignore" "$target_file"; then
      log_fail "Noise: Internal plumbing (.gitignore) leaked into the changelog."
      violations=$((violations + 1))
  else
      log_info "Noise: Internal plumbing correctly filtered out."
  fi

  if grep -qi "Added .* login page" "$target_file"; then
      log_info "Content: New feature entry found (Login Page)."
  else
      log_fail "Content: Feature entry missing (Expected 'login page')."
      violations=$((violations + 1))
  fi

  if grep -qi "Fixed .* bug in api" "$target_file"; then
      log_info "Content: New fix entry found (API Bug)."
  else
      log_fail "Content: Fix entry missing (Expected 'bug in api')."
      violations=$((violations + 1))
  fi

  if [ "$violations" -eq 0 ]; then
    log_info "Success: Changelog verified (Clean, Surgical, Low-Noise)."
    return 0
  else
    return 1
  fi
}