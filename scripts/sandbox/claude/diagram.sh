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
  "name": "sandbox-diagram",
  "version": "1.0.0",
  "private": true
}
EOF

  cat <<'EOF' >>CLAUDE.md

# Ad triage

Two-folder app. `web/` runs a Next.js chat surface. `api/` runs FastAPI tools backed by SQLite for keyword and vector search.
EOF

  cat <<'EOF' >>.claude/ARCHITECTURE.md

# Architecture

## Overview

Two folders: `web/` runs Next.js with the agent loop in the browser via the Vercel AI SDK, and `api/` runs FastAPI wrapping retrieval and ranking tools. SQLite holds the shared corpus with FTS5 for keywords and a numpy cosine scan for vectors.

Four layers, in request-flow order:

1. Web shell (Next.js plus chat components)
2. Agent shell (Vercel AI SDK, registers tools and runs the loop)
3. Backend (FastAPI HTTP layer)
4. Tools implementation (Python: retriever, ranker) plus storage (SQLite)

## Key technical decisions

### Hybrid retrieval

BM25 over FTS5 for exact terms, dense embeddings for semantics, reciprocal rank fusion to combine. Optional cross-encoder rerank when precision matters.

### SQLite over an external vector DB

One file, no extra service, ships embedded in the deploy image.

### BYOK

The deployed app does not carry an LLM key. Users supply their own at chat time, held in browser sessionStorage.
EOF

  mkdir -p web/src/agent web/src/tools api/src/retrieval api/src/ranking

  cat <<'EOF' >web/src/agent/loop.ts
// Vercel AI SDK agent loop. Registers tools and streams to the chat UI.
EOF

  cat <<'EOF' >web/src/tools/search.ts
// TS wrapper that POSTs to /api/tools/search.
EOF

  cat <<'EOF' >api/src/retrieval/hybrid.py
"""Hybrid retriever: BM25 + dense + RRF."""
EOF

  cat <<'EOF' >api/src/retrieval/embedding.py
"""multilingual-e5-base embedding wrapper."""
EOF

  cat <<'EOF' >api/src/ranking/rerank.py
"""Optional cross-encoder reranker."""
EOF

  cat <<'EOF' >docker-compose.yml
services:
  web:
    build: ./web
    ports: ["3000:3000"]
  api:
    build: ./api
    ports: ["8000:8000"]
EOF

  git add . && git commit -m "feat(sandbox): seed two-folder app with architecture and retrieval modules" --no-verify -q

  log_step "Scenario ready: diagram from a multi-component project"
  log_info "Context: web/ + api/ + SQLite, layered ARCHITECTURE.md, retrieval modules under api/src/retrieval/"
  log_info "Signals the skill should pick up:"
  log_info "  .claude/ARCHITECTURE.md: 4 layers, hybrid retrieval, SQLite, BYOK"
  log_info "  docker-compose.yml: web and api services for deploy diagram"
  log_info "  api/src/retrieval/: hybrid + embedding modules for retrieval-pipeline diagram"
  log_info "Action 1: /toolkit:claude-diagram"
  log_info "Expect:   .claude/diagrams/architecture-overview.md with layered components from prose"
  log_info "Action 2: /toolkit:claude-diagram retrieval pipeline"
  log_info "Expect:   .claude/diagrams/retrieval-pipeline.md with BM25 + dense + RRF flow from code"
  log_info "Action 3: /toolkit:claude-diagram deploy"
  log_info "Expect:   .claude/diagrams/deployment.md with web + api services from docker-compose"
}
