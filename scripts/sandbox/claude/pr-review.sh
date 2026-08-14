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
  select_or_route_scenario "Which scenario?" "first-pass" "close-out" "unchanged-head" "answered-head"

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
    log_info "         posts under ## Review closed, since the delta raises no findings of its own"
    log_info "         names the commit and the count read in the summary line"
    log_info "         writes a new body file rather than overwriting the first pass, does NOT merge"
    ;;

  "unchanged-head")
    log_step "Configuring pr-review unchanged-head environment ($ANCHOR_REPO)"
    seed_reviewable_pr

    # A pass carrying only a minor takes the closed heading, so the seed models
    # the state a conforming pass leaves rather than an open one nothing owes.
    # Both headings are in the family the next pass matches, so its commit.oid
    # is still the head that pass reads.
    gh pr review "$PR_URL" --comment --body "## Review closed

0 critical, 0 should-fix, 1 minor. Nothing blocks the merge. Reviewed against project docs and roadmap.

**\`src/tasks.ts\`**

- **minor**: \`handleCreate\` returns the created task without a status field. Nothing consumes one yet.

🤖 Reviewed by Claude Code" 2>/dev/null ||
      log_info "Could not seed the first pass. Post one manually before testing."

    # The worker accepts the minor as recorded, so nothing is committed and the head stays put.
    gh pr comment "$PR_URL" --body "## Review response

Accepted as recorded. No status field is added, since nothing consumes one and the shape is settled by v0.1.

🤖 Addressed by Claude Code" 2>/dev/null ||
      log_info "Could not seed the response. Post one manually before testing."

    log_step "Scenario ready: a second pass at a head the first pass already covered"
    log_info "Context: open PR with a posted ## Review closed, a ## Review response, and no commit since"
    log_info "Action:  /claude-pr-review"
    log_info "Expect:  finds the prior review's commit and sees it equal to headRefOid"
    log_info "         reads the ## Review response rather than a delta, which spans nothing"
    log_info "         names the body body-<number>-<short-sha>-r<comment-id>.md, id off the comment url"
    log_info "         posts under ## Review closed, treating the accepted minor as closed"
    log_info "         does NOT reuse the first pass name, invent a suffix, or merge"
    ;;

  "answered-head")
    log_step "Configuring pr-review answered-head environment ($ANCHOR_REPO)"
    seed_reviewable_pr

    gh pr review "$PR_URL" --comment --body "## Review closed

0 critical, 0 should-fix, 1 minor. Nothing blocks the merge. Reviewed against project docs and roadmap.

**\`src/tasks.ts\`**

- **minor**: \`handleCreate\` returns the created task without a status field. Nothing consumes one yet.

🤖 Reviewed by Claude Code" 2>/dev/null ||
      log_info "Could not seed the first pass. Post one manually before testing."

    gh pr comment "$PR_URL" --body "## Review response

Accepted as recorded. No status field is added, since nothing consumes one and the shape is settled by v0.1.

🤖 Addressed by Claude Code" 2>/dev/null ||
      log_info "Could not seed the response. Post one manually before testing."

    # The close-out the unchanged-head arm produces, so the newest pass post-dates
    # every response and the thread has nothing left to answer.
    gh pr review "$PR_URL" --comment --body "## Review closed

✅ Prior findings addressed. Re-reviewed the response, no commits since the prior pass.

🤖 Reviewed by Claude Code" 2>/dev/null ||
      log_info "Could not seed the close-out. Post one manually before testing."

    log_step "Scenario ready: a re-run after a close-out already answered the thread"
    log_info "Context: open PR whose newest pass is ## Review closed, with no response after it"
    log_info "Action:  /claude-pr-review"
    log_info "Expect:  sees the prior commit equal to headRefOid and scopes responses to the prior pass"
    log_info "         derives nothing, since every response pre-dates the close-out"
    log_info "         stops with 'No response since the prior pass', posting no comment"
    log_info "         does NOT reuse the close-out body name or re-derive its comment id"
    ;;

  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
