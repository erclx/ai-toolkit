#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

# Fakes a live session occupying <path>, so the cleanup arm can prove
# occupancy holds a tree back independently of merge state. The registry this
# writes to is the real one at CLAUDE_CONFIG_DIR (or $HOME/.claude/sessions):
# provisioning and the later `claude -p` run are separate script invocations
# with no shared environment, so there is no sandbox-local registry to point
# at instead. The spawned process and the record file both outlive this
# script on purpose, since the roster has to read them as live from the next
# invocation, and neither is cleaned up automatically.
register_occupant() {
  local worktree_path
  worktree_path="$(cd "$1" && pwd)"

  local sessions_dir
  sessions_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/sessions"
  mkdir -p "$sessions_dir"

  sleep infinity >/dev/null 2>&1 &
  disown
  local occupant_pid=$!

  cat <<EOF >"$sessions_dir/sandbox-occupant.json"
{
  "pid": $occupant_pid,
  "cwd": "$worktree_path",
  "name": "sandbox-occupant",
  "sessionId": "sandbox-occupant",
  "kind": "bg",
  "status": "idle",
  "startedAt": $(($(date +%s%N) / 1000000))
}
EOF

  log_info "Registered a fake occupant session at $sessions_dir/sandbox-occupant.json (pid $occupant_pid)."
  log_info "Not cleaned up automatically: kill $occupant_pid and remove that file when done."
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

    git checkout -b feat/gamma -q
    echo 'export const gamma = true;' >src/gamma.ts
    git add . && git commit -m "feat(gamma): add gamma" --no-verify -q
    git checkout main -q
    git merge --no-ff feat/gamma -m "merge feat/gamma" --no-verify -q

    mkdir -p .claude/worktrees
    git worktree add .claude/worktrees/alpha feat/alpha -q
    git worktree add .claude/worktrees/beta feat/beta -q
    git worktree add .claude/worktrees/gamma feat/gamma -q
    register_occupant .claude/worktrees/gamma

    log_step "Scenario ready: cleanup (offline merge detection via --no-ff)"
    log_info "Context: three linked worktrees. feat/alpha merged into main, feat/beta unmerged,"
    log_info "         feat/gamma merged and clean like alpha but occupied by a fake live session"
    log_info "Action:  /git-worktree list, then /git-worktree cleanup"
    log_info "Expect:  list shows alpha as 'merged (local)', beta as 'unmerged', gamma as 'occupied'"
    log_info "         cleanup removes .claude/worktrees/alpha/ and deletes feat/alpha, leaves beta and gamma alone"
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
