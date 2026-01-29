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
  local target_file="garbage-prose.md"
  
  log_step "Verifying Tone Refactoring (Diff-First Protocol)"

  if [ ! -f "$target_file" ]; then
    log_fail "Target file missing: $target_file"
    return 1
  fi

  local violations=0
  local banned=("delve" "modern" "cutting-edge" "leverage" "excited to" "game-changing" "seamlessly" "robust" "performant" "innovative" "utilize" "mission-critical")

  for word in "${banned[@]}"; do
    if grep -qi "$word" "$target_file"; then
      log_fail "Failure: Banned term '$word' survived in $target_file."
      violations=$((violations + 1))
    fi
  done

  if grep -q "diff -u" "$log_file"; then
      log_info "UX: Visual Unified Diff confirmed in logs."
  else
      log_fail "UX: 'diff -u' command missing. User requested Diff-First."
      violations=$((violations + 1))
  fi


  if grep -q "Updated .*garbage-prose.md" "$log_file"; then
      log_info "Logic: Smart Overwrite applied successfully."
  else
      log_fail "Logic: Auto-apply failed (Expected 'Updated' message for clean file)."
     violations=$((violations + 1))
  fi

  if [ "$violations" -eq 0 ]; then
    log_info "Success: Prose refactored with visual diff."
    return 0
  else
    return 1
  fi
}