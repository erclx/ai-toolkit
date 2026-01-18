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
  log_step "Staging Versioned Environment"

  rm -rf .gemini
  mkdir -p api src

  echo -e "module app\n\ngo 1.22.0" > go.mod

  echo '{"name": "app", "engines": {"node": ">=20.0.0"}, "dependencies": {"react": "^18.2.0"}}' > package.json

  echo "FROM python:3.11-slim" > Dockerfile
  
  log_info "Staged: Go 1.22, Node 20+, Python 3.11"
}

stage_verify() {
  local log_file=$1
  local report_file=".gemini/.tmp/scout_report.md"
  
  if [ ! -f "$report_file" ]; then
    log_fail "Report artifact missing at $report_file"
    return 1
  fi

  local has_go=$(grep -E "Go.*1\.22" "$report_file" || true)
  local has_node=$(grep -E "Node.*20" "$report_file" || true)
  local has_py=$(grep -E "Python.*3\.11" "$report_file" || true)

  log_step "Version Detection Analysis"
  
  if [ -n "$has_go" ]; then
    echo -e "${GREY}│${NC}   Go 1.22:       ${GREEN}DETECTED${NC}"
  else
    echo -e "${GREY}│${NC}   Go 1.22:       ${RED}MISSING${NC}"
  fi

  if [ -n "$has_node" ]; then
    echo -e "${GREY}│${NC}   Node 20+:      ${GREEN}DETECTED${NC}"
  else
    echo -e "${GREY}│${NC}   Node 20+:      ${RED}MISSING${NC}"
  fi

  if [ -n "$has_py" ]; then
    echo -e "${GREY}│${NC}   Python 3.11:   ${GREEN}DETECTED${NC}"
  else
    echo -e "${GREY}│${NC}   Python 3.11:   ${RED}MISSING${NC}"
  fi

  if [ -z "$has_go" ] || [ -z "$has_node" ] || [ -z "$has_py" ]; then
    log_fail "Scout failed to identify specific engine versions."
  return 1
  fi

  log_info "Scout Report captured correct version constraints."
  return 0
}