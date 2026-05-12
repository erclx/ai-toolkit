#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-brief",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  cat <<'EOF' >>CLAUDE.md

# My App

Chat client with a BYOK gate and a small canvas.

## Commands

- `bun run check`: lint and typecheck
EOF

  cat <<'EOF' >>.claude/ARCHITECTURE.md

# Architecture

## Chat surface

Express-style API in `src/api/chat.ts` calls the model provider via `resolveProvider`. Streams SSE chunks back to the client.

## BYOK gate

`src/features/chat/api-key-gate.tsx` collects the visitor's key and stores it in sessionStorage. Today only Anthropic is supported.
EOF

  cat <<'EOF' >>.claude/REQUIREMENTS.md

# Requirements

- Visitors can paste a key and try the chat without an account
- Mock demo path must work without any key for first-time visitors

## Non-goals

- No server-side key storage
EOF

  cat <<'EOF' >.claude/TASKS.md
# Tasks

## Up next

### v5.5 Mock demo mode for no-key visitors

- [ ] Outcome: gate exposes a "Try the demo (no key)" path next to the BYOK picker
- [ ] Outcome: mock provider replays pre-canned SSE chunks against real ad payloads
- [ ] Outcome: empty state shows three curated suggestion chips that fire scripted queries
- [ ] Outcome: free-form input is disabled in mock mode with a link back to the BYOK gate

> Test strategy: vitest plus manual smoke against a deployed preview
EOF

  mkdir -p src/api src/features/chat
  cat <<'EOF' >src/api/chat.ts
export async function POST(req: Request) {
  // resolveProvider switch lives here
  return new Response("ok");
}
EOF

  cat <<'EOF' >src/features/chat/api-key-gate.tsx
export function ApiKeyGate() {
  return <div>BYOK gate, Anthropic only</div>;
}
EOF

  git add . && git commit -m "feat(web): initial BYOK chat shell" --no-verify -q

  log_step "Scenario ready: brief draft for a multi-stream task"
  log_info "Context: TASKS.md has one large v5.5 entry with four outcomes"
  log_info "  ARCHITECTURE.md describes the chat surface and the BYOK gate"
  log_info "  src/api/chat.ts and src/features/chat/api-key-gate.tsx exist as the surfaces to touch"
  log_info ""
  log_info "Action:  /claude-brief v5.5 Mock demo mode for no-key visitors"
  log_info "Expect:  .claude/briefs/mock-demo-mode.md written with Goal, Outcomes, Constraints, Read first, Sequence, Test strategy, Open questions"
  log_info "         .claude/TASKS.md gets a Brief: line under the task title"
  log_info "         Open questions cover fixture location, pacing constants, persistence, and tool id reuse"
}
