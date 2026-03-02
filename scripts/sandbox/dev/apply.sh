#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  mkdir -p src/utils

  cat <<'EOF' >src/config.ts
export const MAX_RETRIES = 3;
export const TIMEOUT = 5000;
EOF

  cat <<'EOF' >mock-response.md
# FILES

## src/config.ts
```ts
export const MAX_RETRIES = 5;
export const TIMEOUT = 10000;
```

## src/utils/helpers.ts
```ts
export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
```
EOF

  log_step "SCENARIO READY: dev:apply file write test"
  log_info "Context: 'src/config.ts' exists (will be edited). 'src/utils/helpers.ts' is new (will be created)."
  log_info "Action:  /dev:apply @mock-response.md"
  log_info "Expect:  ✅ Files applied: src/config.ts, src/utils/helpers.ts"
}
