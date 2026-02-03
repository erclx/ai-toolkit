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
  log_step "Staging Environment"
  
  echo 'console.log("Senior Code")' > index.js
  echo '# My Project' > README.md
  
  : > .gitignore
  

  echo ".git/" > .geminiignore
   
  log_info "Environment staged with manifest files & pre-seeded ignore"
}
