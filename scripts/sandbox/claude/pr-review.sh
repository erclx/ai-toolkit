#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-git.sh"

use_anchor() {
  use_sandbox_anchor
}

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  log_step "Configuring pr-review environment ($ANCHOR_REPO)"

  configure_sandbox_anchor_remote

  find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

  printf 'node_modules\n.claude/plans/\n.claude/review/\n.claude/memory/\n.claude/.tmp/\n' >.gitignore

  cat <<'EOF' >package.json
{
  "name": "sandbox-pr-review",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "echo 'lint ok' && echo 'typecheck ok'"
  }
}
EOF

  cat <<'EOF' >CLAUDE.md
# My App

Task API. Route handlers live in `src/`.

## Commands

- `bun run check`: lint and typecheck
EOF

  mkdir -p .claude
  cat <<'EOF' >.claude/REQUIREMENTS.md
# Requirements

## MVP features

1. List tasks: GET /tasks returns all tasks
2. Create task: POST /tasks adds a task
EOF

  cat <<'EOF' >.claude/ROADMAP.md
# Roadmap

| Version | Status | Outcome | Features | Depends on |
| ------- | ------ | ------- | -------- | ---------- |
| v0.1 | Now | List and create tasks | List tasks, Create task | none |
EOF

  mkdir -p src
  cat <<'EOF' >src/tasks.ts
export function createTask(title: string) {
  return { id: crypto.randomUUID(), title };
}
EOF

  git add . && git commit --allow-empty -m "feat(api): task list endpoint" --no-verify -q
  git push --force origin HEAD:main

  git push origin --delete feat/create-endpoint -q 2>/dev/null || true
  git checkout -b feat/create-endpoint -q

  # Reviewable diff with a subtle defect: no validation, empty title accepted.
  cat <<'EOF' >src/tasks.ts
export function createTask(title: string) {
  return { id: crypto.randomUUID(), title };
}

export function handleCreate(body: { title: string }) {
  return createTask(body.title);
}
EOF

  git add . && git commit -m "feat(api): add create handler" --no-verify -q
  git push --force origin HEAD -q

  gh pr create --draft --title "feat(api): add create handler" \
    --body "Adds the POST /tasks handler for v0.1." --head feat/create-endpoint --base main -q 2>/dev/null ||
    log_info "PR may already exist; continue."

  log_step "Scenario ready: PR review from an independent session"
  log_info "Context: open draft PR on feat/create-endpoint, project docs and ROADMAP present"
  log_info "Action:  /claude-pr-review"
  log_info "Expect:  reviews the PR diff against docs, posts findings to the PR via gh pr review --comment"
  log_info "         flags the missing title validation, does NOT merge"
}
