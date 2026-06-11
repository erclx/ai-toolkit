#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-git.sh"

use_anchor() {
  export ANCHOR_REPO="toolkit-sandbox"
}

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "happy-path" "prose-only"

  log_step "Configuring autoship environment ($ANCHOR_REPO)"

  configure_sandbox_git_identity

  git remote add origin "git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"

  # Wipe anchor content to start clean
  find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

  printf 'node_modules\n.claude/plans/\n.claude/review/\n.claude/memory/\n' >.gitignore

  case "$SELECTED_OPTION" in
  "happy-path")
    cat <<'EOF' >package.json
{
  "name": "sandbox-autoship",
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

Greeting utility library.

## Commands

- `bun run check`: lint and typecheck
EOF

    mkdir -p src
    cat <<'EOF' >src/index.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
EOF

    git add . && git commit --allow-empty -m "feat(project): initial greeting library" --no-verify -q
    git push --force origin HEAD:main

    git push origin --delete feat/add-farewell -q 2>/dev/null || true
    git checkout -b feat/add-farewell -q

    mkdir -p .claude/plans .claude/review

    cat <<'EOF' >.claude/plans/feature-feat-add-farewell.md
# Feature: add farewell utility

Add a `farewell` function to `src/index.ts` that returns a goodbye message, and export it alongside `greet`.

**Files to touch:**

- `src/index.ts`: add `farewell` function

**Risks:**

None identified.

**Questions:**

None identified.
EOF

    mkdir -p .claude/memory
    cat <<'EOF' >.claude/memory/feedback-export-from-index.md
---
name: Export utilities from src/index.ts
description: Public helpers re-export from the package entry point
type: feedback
---

Every public helper in `src/` re-exports from `src/index.ts` so callers import from one entry point.

**Why:** A past session shipped a helper that callers could not import because it was never re-exported.

**How to apply:** When adding a public function under `src/`, add its `export` to `src/index.ts` in the same change.
EOF
    cat <<'EOF' >.claude/memory/MEMORY.md
# Memory Index

## Feedback

| Name | File | Description |
| ---- | ---- | ----------- |
| Export utilities from src/index.ts | [feedback-export-from-index.md](feedback-export-from-index.md) | Public helpers re-export from the package entry point |
EOF

    log_step "Scenario ready: autoship happy path"
    log_info "Context: feat/add-farewell branch with approved plan and one seeded memory entry"
    log_info "Action:  /claude-autoship"
    log_info "Expect:  implements farewell fn, verify passes, review runs, PR opened as draft"
    log_info "         then captures session memory and runs Propose over the pen"
    log_info "         receipt at .claude/review/memory-review-<slug>.md; Apply is NOT run"
    ;;
  "prose-only")
    cat <<'EOF' >package.json
{
  "name": "sandbox-autoship-prose",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "echo 'format ok'"
  }
}
EOF

    cat <<'EOF' >CLAUDE.md
# My Notes

Personal notes repo. Mostly markdown.

## Commands

- `bun run check`: format check
EOF

    mkdir -p docs
    cat <<'EOF' >docs/intro.md
# Intro

Project overview goes here.
EOF

    cat <<'EOF' >README.md
# My Notes

Notes repo.
EOF

    git add . && git commit --allow-empty -m "docs(notes): initial layout" --no-verify -q
    git push --force origin HEAD:main

    git push origin --delete feat/expand-intro -q 2>/dev/null || true
    git checkout -b feat/expand-intro -q

    mkdir -p .claude/plans .claude/review

    cat <<'EOF' >.claude/plans/feature-expand-intro.md
# Feature: expand intro doc

Replace the placeholder intro with two short paragraphs covering scope and structure.

**Files to touch:**

- `docs/intro.md`: replace placeholder with real intro prose

**Risks:**

None identified.

**Questions:**

None identified.
EOF

    log_step "Scenario ready: autoship prose-only diff"
    log_info "Context: feat/expand-intro branch with a plan that touches only docs/intro.md"
    log_info "Action:  /claude-autoship"
    log_info "Expect:  implements prose update, verify passes, REVIEW IS SKIPPED (prose-only diff), PR opened as draft"
    log_info "         autoship Step 5 should print the skip rationale rather than invoking claude-review"
    log_info "         pen is empty, so capture and Propose no-op and the fourth output line is omitted"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
