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

# Seeds the base repo, the feature branch, and the open PR both arms review.
# Sets PR_URL for callers that need to post to the thread.
seed_reviewable_pr() {
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

  PR_URL=$(gh pr create --draft --title "feat(api): add create handler" \
    --body "Adds the POST /tasks handler for v0.1." --head feat/create-endpoint --base main 2>/dev/null ||
    gh pr view feat/create-endpoint --json url -q .url 2>/dev/null)
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "first-pass" "close-out"

  case "$SELECTED_OPTION" in
  "first-pass")
    log_step "Configuring pr-review environment ($ANCHOR_REPO)"
    seed_reviewable_pr

    log_step "Scenario ready: PR review from an independent session"
    log_info "Context: open draft PR on feat/create-endpoint, project docs and ROADMAP present"
    log_info "Action:  /claude-pr-review"
    log_info "Expect:  reviews the PR diff against docs, posts findings to the PR via gh pr review --comment"
    log_info "         opens the comment with the ## Review heading"
    log_info "         writes the body to .claude/.tmp/pr-review/body-<number>-<short-sha>.md"
    log_info "         flags the missing title validation, does NOT merge"
    ;;

  "close-out")
    log_step "Configuring pr-review close-out environment ($ANCHOR_REPO)"
    seed_reviewable_pr

    # Seed the first pass against the pre-fix head, so its commit.oid bounds the delta.
    gh pr review "$PR_URL" --comment --body "## Review

0 critical, 1 should-fix, 0 minor. Reviewed against project docs and roadmap.

**\`src/tasks.ts\`**

- **should-fix**: \`handleCreate\` does not reject an empty title, so a blank task is created. Guard the title before calling \`createTask\`.

🤖 Reviewed by Claude Code" 2>/dev/null ||
      log_info "Could not seed the first pass. Post one manually before testing."

    # The worker's response: one commit, which is the entire delta the close-out reads.
    cat <<'EOF' >src/tasks.ts
export function createTask(title: string) {
  return { id: crypto.randomUUID(), title };
}

export function handleCreate(body: { title: string }) {
  if (!body.title.trim()) {
    throw new Error("title is required");
  }
  return createTask(body.title);
}
EOF

    git add . && git commit -m "fix(api): reject an empty task title" --no-verify -q
    git push origin HEAD -q

    log_step "Scenario ready: close-out on a PR that already carries a review"
    log_info "Context: open PR on feat/create-endpoint with a posted ## Review and one commit since"
    log_info "Action:  /claude-pr-review"
    log_info "Expect:  finds the prior review's commit via gh pr view --json reviews"
    log_info "         reads only fix(api) reject an empty task title, not the whole change"
    log_info "         confirms the empty-title finding landed"
    log_info "         posts under ## Review closed, naming the commit and the count read"
    log_info "         writes a new body file rather than overwriting the first pass, does NOT merge"
    ;;

  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
