#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "cleanup" "list"

  cat <<'EOF' >package.json
{
  "name": "sandbox-git-worktree",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  cat <<'EOF' >CLAUDE.md
# Sandbox

Disposable repo for exercising the `git-worktree` skill.
EOF

  mkdir -p src
  echo 'export const name = "sandbox";' >src/index.ts

  git add . && git commit -m "chore(sandbox): initial commit" --no-verify -q
  git branch -M main

  case "$SELECTED_OPTION" in
  "cleanup")
    git checkout -b feat/alpha -q
    echo 'export const alpha = true;' >src/alpha.ts
    git add . && git commit -m "feat(alpha): add alpha" --no-verify -q
    git checkout main -q
    git merge --no-ff feat/alpha -m "merge feat/alpha" --no-verify -q

    git checkout -b feat/beta -q
    echo 'export const beta = false;' >src/beta.ts
    git add . && git commit -m "feat(beta): add beta" --no-verify -q
    git checkout main -q

    mkdir -p .claude/worktrees
    git worktree add .claude/worktrees/alpha feat/alpha -q
    git worktree add .claude/worktrees/beta feat/beta -q

    log_step "Scenario ready: cleanup (offline merge detection via --no-ff)"
    log_info "Context: two linked worktrees, feat/alpha merged into main, feat/beta unmerged"
    log_info "Action:  /git-worktree list, then /git-worktree cleanup"
    log_info "Expect:  list shows alpha as 'merged (local)' and beta as 'unmerged'"
    log_info "         cleanup removes .claude/worktrees/alpha/ and deletes feat/alpha, leaves beta alone"
    ;;
  "list")
    git checkout -b feat/merged -q
    echo 'export const merged = true;' >src/merged.ts
    git add . && git commit -m "feat(merged): merged feature" --no-verify -q
    git checkout main -q
    git merge --no-ff feat/merged -m "merge feat/merged" --no-verify -q

    git checkout -b feat/dirty -q
    echo 'export const dirty = true;' >src/dirty.ts
    git add . && git commit -m "feat(dirty): committed part" --no-verify -q
    git checkout main -q

    git checkout -b feat/clean -q
    echo 'export const clean = true;' >src/clean.ts
    git add . && git commit -m "feat(clean): clean wip" --no-verify -q
    git checkout main -q

    mkdir -p .claude/worktrees
    git worktree add .claude/worktrees/merged feat/merged -q
    git worktree add .claude/worktrees/dirty feat/dirty -q
    git worktree add .claude/worktrees/clean feat/clean -q

    echo 'export const extra = true;' >.claude/worktrees/dirty/src/extra.ts

    log_step "Scenario ready: list (three-way state mix)"
    log_info "Context: three linked worktrees: merged, dirty (uncommitted edit), clean unmerged"
    log_info "Action:  /git-worktree list"
    log_info "Expect:  table with columns Path, Branch, State, PR, Notes"
    log_info "         merged row shows 'merged (local)', dirty row shows Notes=dirty"
    log_info "         clean row shows 'unmerged'"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
