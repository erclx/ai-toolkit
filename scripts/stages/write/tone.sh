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
  log_step "Injecting 'AI Word Salad' (Mock Data)"
   
  cat <<'EOF' > garbage-prose.md
# Unlocking The Future Of Modern Web Development

In the rapidly evolving landscape of digital solutions, it is crucial to delve into the cutting-edge technologies that leverage AI. 
We are excited to announce a game-changing feature that seamlessly integrates with your existing workflow. 
This robust architecture ensures that your application remains highly performant under load. 
Furthermore, it is important to note that our innovative approach allows developers to utilize best practices right out of the box. 
In conclusion, this mission-critical solution is designed to disrupt the industry.
EOF

  log_info "Mock prose injected at garbage-prose.md"
 
  log_info "Committing mock prose to Git"
  git add . > /dev/null 2>&1
  git commit -m 'chore(sandbox): add mock prose' --no-verify -q > /dev/null

}

stage_verify() {
  local log_file=$1
  local audit_file=".gemini/.tmp/tone-audit.md"
  
  log_step "Verifying Tone Refactoring"

  if [ ! -f "$audit_file" ]; then
    log_fail "Audit artifact missing at $audit_file"
    return 1
  fi

  local violations=0
  local banned=("delve" "modern" "cutting-edge" "leverage" "excited to" "game-changing" "seamlessly" "robust" "performant" "innovative" "utilize" "mission-critical")

  for word in "${banned[@]}"; do
    if grep -qi "$word" "$audit_file"; then
      log_fail "Failure: Banned term '$word' survived the audit."
      violations=$((violations + 1))
    fi
  done

  if grep -q "diff --color=always" "$log_file" || grep -q "diff" "$log_file"; then
     log_info "UX: Diff command detected in output."
  else
     log_fail "UX: Diff command missing."
     violations=$((violations + 1))
  fi

  if [ "$violations" -eq 0 ]; then
    log_info "Success: All 'AI Tells' purged and Diff provided."
    return 0
  else
    return 1
  fi
}