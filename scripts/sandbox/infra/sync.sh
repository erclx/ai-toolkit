#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"
source "$PROJECT_ROOT/scripts/lib/gov.sh"
source "$PROJECT_ROOT/scripts/lib/sandbox-git.sh"

use_anchor() {
  export ANCHOR_REPO="toolkit-sandbox"
}

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
  export SANDBOX_INJECT_GOV="true"
}

stage_setup() {
  local src_standards="$PROJECT_ROOT/standards"
  local src_rules="$PROJECT_ROOT/governance/rules"

  configure_sandbox_git_identity

  git remote add origin "git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    echo "<!-- stale -->" >>"standards/$filename"
  done < <(find "$src_standards" -type f -name "*.md" | sort | head -n 2)

  while IFS= read -r file; do
    local rule
    rule=$(basename "$file" .mdc)
    local subdir
    subdir=$(rule_subdir "$file" "$src_rules")
    local dest=".claude/rules/${rule}.md"
    [ -n "$subdir" ] && dest=".claude/rules/$subdir/${rule}.md"
    [ -f "$dest" ] && echo "# stale" >>"$dest"
  done < <(find "$src_rules" -type f -name "*.mdc" | sort | head -n 2)

  git add .
  git commit -m "chore(sandbox): make standards and governance stale" --no-verify -q

  git push --force origin HEAD:main -q
  git ls-remote --heads origin 'chore/toolkit-sync*' 2>/dev/null |
    awk '{print $2}' | sed 's|refs/heads/||' |
    while read -r b; do git push origin --delete "$b" -q 2>/dev/null || true; done

  log_step "Sync sandbox"
  log_info "Anchor: $ANCHOR_REPO"
  log_info "Stale: standards/ (2 files), .claude/rules/ (2 files)"
  log_info "Remote: git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"

  log_step "Running: aitk sync"
  exec "$PROJECT_ROOT/scripts/manage-sync.sh" .
}
