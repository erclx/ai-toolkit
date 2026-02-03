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
