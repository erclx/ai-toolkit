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

- Core: Initial release of the system.
EOF
  
  git add CHANGELOG.md
  git commit -m "chore(docs): init changelog" -q
  git tag v1.0.0

  touch auth.js
  git add auth.js
  git commit -m "feat(auth): add jwt validation logic" -q
  
  touch api.js
  git add api.js
  git commit -m "fix(api): patch buffer overflow in handler" -q
  
  echo "node_modules" >> .gitignore
  git add .gitignore
  git commit -m "chore(gitignore): update gitignore rules" -q
  
  log_info "Environment ready: v1.0.0 + Feature + Security Fix + Noise"
}
