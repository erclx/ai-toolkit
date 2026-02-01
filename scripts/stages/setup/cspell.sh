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
  log_step "Staging Greenfield Environment"

  git init -q
  
  echo '{"name": "test-project", "scripts": {"test": "echo 1"}}' > package.json
  
  touch bun.lock
  
  log_info "Environment staged: bare repo + package.json + bun.lock"
}

stage_verify() {
  local log_file=$1
  local errors=0

  log_step "Verifying CSpell Infrastructure"

  if [ -d ".cspell" ] && [ -f ".cspell/project-terms.txt" ]; then
    log_info "SUCCESS: .cspell/ directory and dictionaries created."
  else
    log_fail "FAILURE: Dictionaries missing."
    errors=$((errors + 1))
  fi

  if [ -f "cspell.json" ]; then
    if grep -q "useGitignore" "cspell.json"; then
      log_info "SUCCESS: cspell.json created with 'useGitignore'."
    else
      log_fail "FAILURE: cspell.json missing 'useGitignore' setting."
      errors=$((errors + 1))
    fi
    
    if grep -q "\$schema" "cspell.json"; then
      log_fail "FAILURE: cspell.json contains \$schema (Requested clean config)."
      errors=$((errors + 1))
    else
      log_info "SUCCESS: cspell.json is clean (No \$schema)."
    fi
  else
    log_fail "FAILURE: cspell.json missing."
    errors=$((errors + 1))
  fi

  if grep -q "lint:spelling" "package.json"; then
    if grep -q "cspell '**'" "package.json"; then
        log_info "SUCCESS: Script added with clean single quotes ('**')."
    else
        log_fail "FAILURE: Script added but quoting seems wrong (Check for backslashes)."
        errors=$((errors + 1))
    fi
  else
    log_fail "FAILURE: package.json script missing."
    errors=$((errors + 1))
  fi

  if grep -qi "bun add" "$log_file"; then
    log_info "SUCCESS: Correctly detected Bun runtime from lockfile."
  else
    log_fail "FAILURE: Did not attempt to use Bun (Runtime detection failed)."
    errors=$((errors + 1))
  fi

  if [ -f ".gitignore" ]; then
    if grep -qF "# Dependencies" ".gitignore" && grep -qF "node_modules/" ".gitignore"; then
       log_info "SUCCESS: .gitignore contains '# Dependencies' header and 'node_modules/' rule."
    else
       log_fail "FAILURE: .gitignore missing required headers or rules."
       errors=$((errors + 1))
    fi

    if [ -z "$(tail -c 1 .gitignore)" ]; then
       log_info "SUCCESS: .gitignore ends with a newline."
    else 
       log_fail "FAILURE: .gitignore EOF hygiene violated (no newline at end)."
       errors=$((errors + 1))
    fi
  else
    log_fail "FAILURE: .gitignore was not created."
    errors=$((errors + 1))
  fi

  return $errors
}