#!/usr/bin/env bash
set -e
set -o pipefail

# No project copy of the corpus, which is what every target looks like now. The
# absence forces `claude-review` onto the
# `${CLAUDE_SKILL_DIR}/../../standards/skill.md` fallback, and the branch name
# below turns that citation into a report filename a reader can check by eye.
# `expect.toml` carries that claim as a manual entry rather than an assertion,
# because the report lands at a root no run determines. An arm that staged a copy
# of its own resolves the project path instead and stops being about the fallback
# at all, so the declaration asserts the absence to make that edit go red rather
# than pass quietly.
use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-review",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  cat <<'EOF' >>CLAUDE.md

# My App

REST API for user management.

## Commands

- `bun run check`: lint and typecheck
EOF

  mkdir -p src/api
  cat <<'EOF' >src/api/users.ts
export async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
EOF

  git add . && git commit -m "feat(api): initial user endpoint" --no-verify -q

  git checkout -b feat/user-batch -q

  cat <<'EOF' >src/api/users.ts
export async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

export async function getUsers(ids: string[]) {
  const results = [];
  for (let i = 0; i <= ids.length; i++) {
    const user = await getUser(ids[i]);
    results.push(user);
  }
  return results;
}

export function mergeUser(base: Record<string, unknown>, patch: Record<string, unknown>) {
  return Object.assign(base, patch);
}
EOF

  git add . && git commit -m "feat(api): add batch user fetch and merge" --no-verify -q

  log_step "Scenario ready: review with known bugs"
  log_info "Context: feat/user-batch branch, one commit ahead of main with three bugs:"
  log_info "  1. Off-by-one in getUsers loop (i <= ids.length)"
  log_info "  2. No error handling on fetch response"
  log_info "  3. mergeUser mutates the base object"
  log_info ""
  log_info "This arm also checks the standards citation, not the skill alone."
  log_info "  .claude/standards/ is absent, so the skill must reach the plugin copy"
  log_info "  the slug transform lives only in standards/skill.md, never in the skill body"
  log_info "  so review-user-batch.md is evidence the fallback resolved"
  log_info "  read that filename yourself, the checker cannot assert it yet"
  log_info ""
  log_info "Action:  /canon:claude-review"
  log_info "Expect:  declared in fixtures/claude/review/expect.toml"
  log_info "         Check it with: canon sandbox check claude:review"
  log_info "         One assertion is mechanical. Four claims need a reader."
}
