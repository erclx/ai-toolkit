#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-migration-claude-md",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  cat <<'EOF' >CLAUDE.md
# My App

Web and python project whose CLAUDE.md grew large before the three-tier model.

## Output

- After editing a file, print its path on its own line so the terminal can link it.
- Group paths under Created, Modified, and Deleted headers when a response spans files.

## Frontend

- Server components by default. Add `'use client'` only when a component needs state.
- Domain UI lives under `src/features/`, never in `src/app/` route files.
- Do not lint the `.next/` build output.

## Python

- Manage dependencies with `uv`. Do not call `pip` directly.
- Type every function signature. Run `uv run mypy` before pushing.

## Architecture

The app splits into a Next.js front end and a FastAPI back end. The front end
owns the chat UI and calls the back end over a typed client. The back end holds
the agent loop and persists sessions to Postgres. A worker queue drains long
jobs so request handlers stay fast.

## Testing

- Write a test with every behavior change. Cover the critical path and edge cases.
- Do not use snapshot tests for verification.
EOF

  mkdir -p src/features src/app
  git add . && git commit -m "chore(project): initial layout" --no-verify -q

  log_step "Scenario ready: classify CLAUDE.md sections for migration"
  log_info "Context: a large CLAUDE.md with sections spanning the three tiers"
  log_info "  ## Output       always-load: cross-cutting output formatting"
  log_info "  ## Frontend     path-scoped: applies under src/app and src/features"
  log_info "  ## Python       path-scoped: applies to python files"
  log_info "  ## Architecture domain narrative: how the system is built"
  log_info "  ## Testing      always-load: global test discipline"
  log_info ""
  log_info "Action:  /migration-claude-md"
  log_info "Expect:  grouped proposal:"
  log_info "         Keep in CLAUDE.md: Output, Testing"
  log_info "         Extract to a path-scoped rule: Frontend, Python (with globs)"
  log_info "         Extract to a context entry: Architecture"
  log_info "         Skill does NOT edit CLAUDE.md and does NOT create the files"
}
