#!/usr/bin/env bash
set -e
set -o pipefail

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

  local -a stale_standards=()
  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    [ -f ".claude/standards/$filename" ] || continue
    echo "<!-- stale -->" >>".claude/standards/$filename"
    stale_standards+=("$filename")
    [ "${#stale_standards[@]}" -eq 2 ] && break
  done < <(find "$src_standards" -maxdepth 1 -type f -name "*.md" ! -name "index.md" | sort)

  local -a stale_rules=()
  while IFS= read -r file; do
    local rule
    rule=$(basename "$file" .md)
    local subdir
    subdir=$(rule_subdir "$file" "$src_rules")
    local dest=".claude/rules/${rule}.md"
    [ -n "$subdir" ] && dest=".claude/rules/$subdir/${rule}.md"
    [ -f "$dest" ] || continue
    echo "# stale" >>"$dest"
    stale_rules+=("${dest#.claude/rules/}")
    [ "${#stale_rules[@]}" -eq 2 ] && break
  done < <(find "$src_rules" -type f -name "*.md" | sort)

  git add .
  git commit -m "chore(sandbox): make standards and governance stale" --no-verify -q

  git push --force origin HEAD:main -q
  git ls-remote --heads origin 'chore/toolkit-sync*' 2>/dev/null |
    awk '{print $2}' | sed 's|refs/heads/||' |
    while read -r b; do git push origin --delete "$b" -q 2>/dev/null || true; done

  log_step "Sync sandbox"
  log_info "Anchor: $ANCHOR_REPO"
  log_info "Stale standards: ${stale_standards[*]}"
  log_info "Stale rules: ${stale_rules[*]}"
  log_info "Remote: git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"

  log_step "Running: aitk sync"
  exec bun "$PROJECT_ROOT/src/cli.ts" sync .
}
