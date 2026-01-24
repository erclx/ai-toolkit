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
  if [ -z "$ANCHOR_REPO" ]; then
  export ANCHOR_REPO="vite-react-template"
  fi
}

stage_setup() {
  log_step "Pre-Flight: Injecting Real-World Context ($ANCHOR_REPO)"
  log_info "Context Injected for: $ANCHOR_REPO"
}

stage_verify() {
  local log_file=$1
  local cursor_rules=".cursorrules"
  local pkg_rule=".cursor/rules/package-manager.mdc"
  local tech_rule=".cursor/rules/tech-stack.mdc"

  log_step "Verifying Cursor Rules Generation ($ANCHOR_REPO)"

  if [ ! -f "$cursor_rules" ]; then
    log_fail "Artifact Missing: .cursorrules"
    return 1
  fi

  if [ ! -f "$pkg_rule" ]; then
    log_fail "Artifact Missing: $pkg_rule"
    return 1
  fi

  if [ ! -f "$tech_rule" ]; then
    log_fail "Artifact Missing: $tech_rule"
       return 1
    fi

  if grep -q "Zen of Gemini" "$cursor_rules" && grep -q "Core Laws" "$cursor_rules"; then
     log_info "Global: Universal Constitution merged correctly."
  else
     log_fail "Global: Constitution missing or malformed."
     return 1
  fi

    if grep -q "Project Reality" "$cursor_rules"; then
       log_info "Global: Scout Reality section appended."
    else
       log_fail "Global: Scout Reality section missing."
       return 1
    fi

  if [[ "$ANCHOR_REPO" == *"python"* ]]; then
    if grep -q "uv" "$pkg_rule" && grep -q "ALWAYS use uv" "$pkg_rule"; then
       log_info "Rule (Python): Package Manager enforces UV."
    else
       log_fail "Rule (Python): Package Manager incorrect (Expected UV)."
       return 1
    fi

    if grep -q "Python" "$tech_rule" || grep -q "FastAPI" "$tech_rule"; then
       log_info "Rule (Python): Tech Stack identified Python."
    else
       log_fail "Rule (Python): Tech Stack missing Python context."
       return 1
    fi

    if grep -q "\.py" "$tech_rule"; then
       log_info "Rule (Python): Globs correctly set for .py files."
  else
       log_fail "Rule (Python): Globs incorrect (Expected .py)."
    return 1
  fi

  else
    if grep -q "bun" "$pkg_rule" && grep -q "NEVER use npm" "$pkg_rule"; then
       log_info "Rule (React): Package Manager enforces Bun."
    else
       log_fail "Rule (React): Package Manager incorrect (Expected Bun)."
       return 1
    fi

    if grep -iq "Tailwind" "$tech_rule"; then
       log_info "Rule (React): Tailwind paradigm detected."
    else
       log_fail "Rule (React): Failed to detect Tailwind."
       return 1
    fi
    
    if grep -q "\.tsx" "$tech_rule"; then
       log_info "Rule (React): Globs correctly set for TSX files."
    else
       log_fail "Rule (React): Globs incorrect (Expected .tsx)."
       return 1
    fi
  fi

  return 0
}