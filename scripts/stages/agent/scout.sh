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
  log_step "Refining Anchor Environment ($ANCHOR_REPO)"
  
  if [ "$ANCHOR_REPO" == "uv-python-template" ]; then
    echo "3.12.0" > .python-version
  else
  echo "v20.0.0" > .nvmrc
  fi
  
  log_info "Anchor prepared for Deep Scout"
}

stage_verify() {
  local log_file=$1
  local report_file=".gemini/.tmp/scout_report.md"
  
  if [ ! -f "$report_file" ]; then
    log_fail "Report artifact missing at $report_file"
    return 1
  fi
  
  log_step "Anchor Verification ($ANCHOR_REPO)"

  if [ "$ANCHOR_REPO" == "uv-python-template" ]; then
    if grep -qi "Python" "$report_file"; then
      log_info "Runtime: Python detected"
    else
      log_fail "Runtime: Python missing in report"
      return 1
    fi
    
    if grep -qi "uv" "$report_file" || grep -qi "pyproject.toml" "$report_file"; then
      log_info "Manager: UV/PyProject detected"
    else
      log_fail "Manager: UV/PyProject missing in report"
      return 1
    fi
  else
  if grep -qi "Vite" "$report_file"; then
    log_info "Framework: Vite detected"
  else
    log_fail "Framework: Vite missing in report"
    return 1
  fi

  if grep -qi "React" "$report_file"; then
    log_info "Framework: React detected"
  else
      log_fail "Framework: React missing in report"
    return 1
  fi
  fi
  
  log_info "Scout successfully identified Anchor stack."
  return 0
}