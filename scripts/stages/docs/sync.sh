#!/bin/bash
set -e

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"
  
  mkdir -p src
  
  cat <<'EOF' > src/server.ts
export const config = { port: 8080 };
export function start() { console.log("Starting..."); }
EOF

  cat <<'EOF' > README.md
# API Server

## Configuration

Run on port `8080`.

## Usage

```typescript
start();
```
EOF

  mkdir -p docs
  echo "Mock readme rules" > docs/readme.md

  git add . && git commit -m "feat(server): add base config and start function" -q
  
  git checkout -b chore/noise -q
  
  sed -i 's/Starting.../Server is booting up.../g' src/server.ts
  git add . && git commit -m "chore(server): update console log messages" -q

  git checkout main -q
  git checkout -b feature/drift -q
  
  cat <<'EOF' > src/server.ts
export const config = { port: 3000 };
export function start(debug: boolean) { console.log("Starting..."); }
EOF

  git add . && git commit -m "feat(server): change port to 3000 and add debug parameter" -q

  log_info "Repo Prepared with 2 Test Branches:"
  log_info "  1. feature/drift (Currently Checked Out) -> Should TRIGGER update"
  log_info "  2. chore/noise   (git checkout chore/noise) -> Should IGNORE update"
}
