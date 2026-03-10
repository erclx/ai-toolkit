#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  mkdir -p src/api

  cat <<'EOF' >mock-response.md
### TASK

Add a user fetch utility with batch support and merge helper.

### PLAN

1. Create `src/api/users.ts` with `fetchUser`, `fetchUsers`, and `mergeUser`.
2. `fetchUser` fetches a single user by ID from `/api/users/:id`.
3. `fetchUsers` iterates IDs and calls `fetchUser` for each.
4. `mergeUser` merges a patch object into a base user object.

### FILES

File: src/api/users.ts

```ts
export async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  const data = await res.json();
  return data;
}

export async function fetchUsers(ids: string[]) {
  const results = [];
  for (let i = 0; i <= ids.length; i++) {
    const user = await fetchUser(ids[i]);
    results.push(user);
  }
  return results;
}

export function mergeUser(base: object, patch: object) {
  return Object.assign(base, patch);
}
```
EOF

  log_step "Scenario ready: dev:review code findings test"
  log_info "Context: 'mock-response.md' contains a Gemini reply with three bugs"
  log_info "Action:  gemini dev:review \"\$(cat mock-response.md)\""
  log_info "Expect:  findings report grouping bugs by severity across src/api/users.ts"
}
