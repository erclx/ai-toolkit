#!/bin/bash
set -e
set -o pipefail

use_anchor() {
  export ANCHOR_REPO="toolkit-sandbox"
}

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  log_step "Configuring autoship environment ($ANCHOR_REPO)"

  git config user.email "${GITHUB_ORG}@github.com"
  git config user.name "Eric"

  git remote add origin "git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"

  # Wipe anchor content to start clean
  find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

  printf 'node_modules\n.claude/plans/\n.claude/review/\n' >.gitignore

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

  log_step "Scenario ready: autoship happy path"
  log_info "Context: feat/add-farewell branch with approved plan at .claude/plans/feature-feat-add-farewell.md"
  log_info "Action:  /claude-autoship"
  log_info "Expect:  implements farewell fn, verify passes, review runs, PR opened as draft"
}
