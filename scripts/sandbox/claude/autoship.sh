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
  select_or_route_scenario "Which scenario?" "happy-path" "prose-informational" "prose-executable"

  log_step "Configuring autoship environment ($ANCHOR_REPO)"

  configure_sandbox_anchor_remote

  # Wipe anchor content to start clean
  find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

  printf 'node_modules\n.canon/plans/\n.canon/review/\n.canon/memory/\n' >.gitignore

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

    mkdir -p .canon/plans .canon/review

    cat <<'EOF' >.canon/plans/feature-add-farewell.md
# Feature: add farewell utility

Add a `farewell` function to `src/index.ts` that returns a goodbye message, and export it alongside `greet`.

**Files to touch:**

- `src/index.ts`: add `farewell` function

**Risks:**

None identified.

**Questions:**

None identified.
EOF

    mkdir -p .canon/memory
    cat <<'EOF' >.canon/memory/feedback-export-from-index.md
---
title: Export utilities from src/index.ts
description: Public helpers re-export from the package entry point
category: Feedback
---

Every public helper in `src/` re-exports from `src/index.ts` so callers import from one entry point.

**Why:** A past session shipped a helper that callers could not import because it was never re-exported.

**How to apply:** When adding a public function under `src/`, add its `export` to `src/index.ts` in the same change.
EOF
    cat <<'EOF' >.canon/memory/index.md
---
title: Memory
subtitle: Session facts with no owning surface, grouped by kind.
---

# Memory

Session facts with no owning surface, grouped by kind.

## Feedback

- [Export utilities from src/index.ts](feedback-export-from-index.md): Public helpers re-export from the package entry point
EOF

    log_step "Scenario ready: autoship happy path"
    log_info "Context: main, with an approved plan staged for feat/add-farewell and one seeded memory entry"
    log_info "Action:  /claude-autoship"
    log_info "Expect:  implements farewell fn, verify passes, review runs, PR opened as draft"
    log_info "         Step 7 invokes git-ship rather than restating the chain, so the verify"
    log_info "         runs twice and the draft marking lands before the CI watch"
    log_info "         a headless run with no interaction has nothing for capture to find, so"
    log_info "         it typically reports Nothing worth capturing and Step 9 is skipped"
    ;;
  "prose-informational")
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

    mkdir -p .canon/plans .canon/review

    cat <<'EOF' >.canon/plans/feature-expand-intro.md
# Feature: expand intro doc

Replace the placeholder intro with two short paragraphs covering scope and structure.

**Files to touch:**

- `docs/intro.md`: replace placeholder with real intro prose

**Risks:**

None identified.

**Questions:**

None identified.
EOF

    log_step "Scenario ready: autoship informational prose diff"
    log_info "Context: main, with a plan staged for feat/expand-intro touching only docs/intro.md"
    log_info "Action:  /claude-autoship"
    log_info "Expect:  implements prose update, verify passes, REVIEW IS SKIPPED, PR opened as draft"
    log_info "         docs/ is outside every behavior path, so both classifier tests pass"
    log_info "         autoship Step 5 should print the skip rationale rather than invoking claude-review"
    log_info "         pen is empty, so capture and Propose no-op and the fourth output line is omitted"
    ;;
  "prose-executable")
    cat <<'EOF' >package.json
{
  "name": "sandbox-autoship-skill",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "echo 'format ok'"
  }
}
EOF

    cat <<'EOF' >CLAUDE.md
# My App

Service repo carrying its own project-local skills.

## Commands

- `bun run check`: format check
EOF

    mkdir -p docs
    cat <<'EOF' >docs/intro.md
# Intro

Project overview goes here.
EOF

    mkdir -p .claude/skills/deploy-check
    cat <<'EOF' >.claude/skills/deploy-check/SKILL.md
---
name: deploy-check
description: Verifies a release candidate before promotion. Use when asked to "check the deploy" or "verify the candidate".
---

# Deploy check

## Step 1: read the candidate

Read the tag the release job wrote.

## Step 2: report

Report the tag and stop. Do not promote.
EOF

    git add . && git commit --allow-empty -m "feat(project): initial service layout" --no-verify -q
    git push --force origin HEAD:main

    git push origin --delete feat/tighten-deploy-check -q 2>/dev/null || true

    mkdir -p .canon/plans .canon/review

    cat <<'EOF' >.canon/plans/feature-tighten-deploy-check.md
# Feature: tighten the deploy-check skill

Give `deploy-check` a stop condition when no tag resolves, so the skill reports the miss rather than reading an empty value as a pass.

**Files to touch:**

- `.claude/skills/deploy-check/SKILL.md`: add the stop condition to Step 1

**Risks:**

None identified.

**Questions:**

None identified.
EOF

    log_step "Scenario ready: autoship executable prose diff"
    log_info "Context: main, with a plan staged for feat/tighten-deploy-check touching only a SKILL.md body"
    log_info "Action:  /claude-autoship"
    log_info "Expect:  implements the stop condition, verify passes, REVIEW RUNS, PR opened as draft"
    log_info "         the diff is all markdown, so the extension test passes and the path test fails"
    log_info "         .claude/skills/ is a behavior path, so Step 5 must invoke claude-review"
    log_info "         a skipped review here is the defect this arm exists to catch"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
