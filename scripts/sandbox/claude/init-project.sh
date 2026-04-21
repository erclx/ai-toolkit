#!/bin/bash
set -e
set -o pipefail

# Documented exception: does not set SANDBOX_INJECT_SEEDS. This scenario tests
# `aitk init` itself, which installs the seeds. Pre-injecting would invalidate
# the test.

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "fresh" "vite-react" "astro"

  case "$SELECTED_OPTION" in
  "fresh")
    cat <<'EOF' >package.json
{
  "name": "sandbox-fresh",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

    git add . && git commit -m "chore(sandbox): fresh empty project" --no-verify -q

    log_step "Scenario ready: init-project skill on an empty repo"
    log_info "Context: package.json only, no framework evidence"
    log_info "Action:  /toolkit:init-project"
    log_info "Expect:  stack resolves to 'base' (fallback), preview shows base + snippets + wiki + claude"
    ;;
  "vite-react")
    cat <<'EOF' >package.json
{
  "name": "sandbox-vite-react",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.6.0"
  }
}
EOF

    cat <<'EOF' >vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
EOF

    cat <<'EOF' >tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true
  }
}
EOF

    mkdir -p src
    cat <<'EOF' >src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <h1>Hello</h1>
  </React.StrictMode>,
);
EOF

    git add . && git commit -m "chore(sandbox): vite + react scaffold" --no-verify -q

    log_step "Scenario ready: init-project skill on a Vite + React project"
    log_info "Context: vite.config.ts, tsconfig.json, React deps in package.json"
    log_info "Action:  /toolkit:init-project"
    log_info "Expect:  governance stack resolves to 'react', base + claude + snippets + wiki installed, gaps surfaced for unmatched rules"
    ;;
  "astro")
    cat <<'EOF' >package.json
{
  "name": "sandbox-astro",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "astro": "^5.0.0"
  }
}
EOF

    cat <<'EOF' >astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({});
EOF

    mkdir -p src/pages
    cat <<'EOF' >src/pages/index.astro
---
---

<html>
  <body>
    <h1>Hello</h1>
  </body>
</html>
EOF

    git add . && git commit -m "chore(sandbox): astro scaffold" --no-verify -q

    log_step "Scenario ready: init-project skill on an Astro project"
    log_info "Context: astro.config.mjs, astro dep in package.json, src/pages/"
    log_info "Action:  /toolkit:init-project"
    log_info "Expect:  stack resolves to 'astro', preview reflects astro reference and deps"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
