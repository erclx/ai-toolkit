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
  log_step "Staging Polyglot Environment"

  rm -rf .gemini
  mkdir -p api/server src/data

  echo -e "module senior-app/api\n\ngo 1.21" > api/go.mod
  echo 'package main; import "github.com/gin-gonic/gin"' > api/server/main.go

  echo '{"name": "tooling", "devDependencies": {"webpack": "5.0"}}' > package.json

  echo 'import pandas as pd' > src/data/analysis.py

  touch Makefile Dockerfile
  
  log_info "Environment staged: Go (API), Python (Data), Webpack (Tooling)"
}

stage_verify() {
  local log_file=$1
  local report_file=".gemini/.tmp/scout_report.md"
  
  if [ ! -f "$report_file" ]; then
    log_fail "Report artifact missing at $report_file"
    return 1
  fi

  local has_go=$(grep -Ei "Go|Gin" "$report_file" || true)
  local has_py=$(grep -Ei "Python|Pandas" "$report_file" || true)
  local has_infra=$(grep -Ei "Docker|Makefile" "$report_file" || true)

  log_step "Report Metadata Analysis"
  
  if [ -n "$has_go" ]; then
    echo -e "${GREY}│${NC}   Go Detected:     ${GREEN}YES${NC}"
  else
    echo -e "${GREY}│${NC}   Go Detected:     ${RED}NO${NC}"
  fi

  if [ -n "$has_py" ]; then
    echo -e "${GREY}│${NC}   Python Detected: ${GREEN}YES${NC}"
  else
    echo -e "${GREY}│${NC}   Python Detected: ${RED}NO${NC}"
  fi

  if [ -n "$has_infra" ]; then
    echo -e "${GREY}│${NC}   Infra Detected:  ${GREEN}YES${NC}"
  else
    echo -e "${GREY}│${NC}   Infra Detected:  ${RED}NO${NC}"
  fi

  if [ -z "$has_go" ] || [ -z "$has_py" ]; then
    log_fail "Scout failed to identify the polyglot nature of the stack."
  return 1
  fi

  log_info "Scout Report validated successfully."
  return 0
}