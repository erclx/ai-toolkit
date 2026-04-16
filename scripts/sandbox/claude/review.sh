#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
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

  cat <<'EOF' >CLAUDE.md
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
  log_info "Action:  /claude-review"
  log_info "Expect:  findings report with critical/should-fix/minor across src/api/users.ts"
}
