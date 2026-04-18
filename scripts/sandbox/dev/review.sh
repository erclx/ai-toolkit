#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  select_or_route_scenario "Which scenario?" "args" "branch-diff"

  case "$SELECTED_OPTION" in
  "args")
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

    log_step "Scenario ready: dev:review args mode"
    log_info "Context: 'mock-response.md' contains a Gemini reply with three bugs"
    log_info "Action:  gemini dev:review @mock-response.md"
    log_info "Expect:  findings report grouping bugs by severity across src/api/users.ts"
    ;;

  "branch-diff")
    mkdir -p src/api

    git checkout -b feat/orders >/dev/null 2>&1

    cat <<'EOF' >src/api/orders.ts
export async function getOrders(userId: string) {
  const res = await fetch(`/api/orders?user=${userId}`);
  if (res.status !== 200) throw new Error("fetch failed");
  const data = await res.json();
  return data.orders;
}

export async function cancelOrder(id: string) {
  const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
  const data = await res.json();
  return data;
}

export function applyDiscount(price: number, pct: number) {
  return price - (price * pct / 100);
}
EOF

    git add src/api/orders.ts
    git commit -m "feat(api): add orders API" --no-verify >/dev/null

    log_step "Scenario ready: dev:review branch diff mode"
    log_info "Context: on feat/orders, one commit ahead of main with three reviewable bugs"
    log_info "Action:  gemini dev:review"
    log_info "Expect:  findings report against branch diff, no args needed"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
