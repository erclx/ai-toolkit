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
  log_step "Configuring address-review environment ($ANCHOR_REPO)"

  configure_sandbox_anchor_remote

  find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

  printf 'node_modules\n.claude/plans/\n.claude/review/\n.claude/memory/\n.claude/.tmp/\n' >.gitignore

  cat <<'EOF' >package.json
{
  "name": "sandbox-address-review",
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

  mkdir -p src
  cat <<'EOF' >src/tasks.ts
export function createTask(title: string) {
  return { id: crypto.randomUUID(), title };
}
EOF

  mkdir -p .claude/context
  cat <<'EOF' >.claude/context/api.md
---
title: API
description: Task creation endpoint and handlers in src/tasks.ts
---

# API

Route handlers live in `src/tasks.ts`. `handleCreate` builds a task from the request body and returns it. No input validation runs before creation.
EOF

  git add . && git commit --allow-empty -m "feat(api): task list endpoint" --no-verify -q
  git push --force origin HEAD:main

  git push origin --delete feat/create-endpoint -q 2>/dev/null || true
  git checkout -b feat/create-endpoint -q

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

  pr_url=$(gh pr create --draft --title "feat(api): add create handler" \
    --body "Adds the POST /tasks handler for v0.1." --head feat/create-endpoint --base main 2>/dev/null ||
    gh pr view feat/create-endpoint --json url -q .url 2>/dev/null)

  # Seed a review finding the worker must address.
  gh pr review "$pr_url" --comment \
    --body "1 should-fix. src/tasks.ts: handleCreate does not reject an empty title. Add a guard before createTask." \
    -q 2>/dev/null || log_info "Could not seed review; post one manually before testing."

  log_step "Scenario ready: worker addresses a posted PR review"
  log_info "Context: open PR on feat/create-endpoint with one should-fix review finding posted"
  log_info "Action:  /claude-address-review"
  log_info "Expect:  reads the finding, adds the empty-title guard, verify passes"
  log_info "         refreshes the now-stale .claude/context/api.md validation line"
  log_info "         pushes a follow-up commit, then posts a summary reply comment, does NOT merge"
}
