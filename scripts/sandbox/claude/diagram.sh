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

  mkdir -p fixtures

  cat <<'EOF' >fixtures/known-bad.mmd
flowchart TB
  subgraph Browser
    A["Web shell"]
    B["Chat components"]
    C["Agent loop with Vercel AI SDK"]
    D["Tool registry"]
  end
  subgraph Server
    E["FastAPI HTTP layer"]
    F["Retriever"]
    G["Ranker"]
    H["Cross encoder reranker"]
    I["Embedding wrapper"]
  end
  subgraph Storage
    J["SQLite corpus"]
    K["FTS5 keyword index"]
    L["Vector table"]
  end
  A --> B --> C --> D --> E
  E --> F --> J
  F --> K
  F --> I --> L
  F --> G --> H
  H --> E
  G --> E
  J --> F
  K --> F
  L --> F
EOF

  git add . && git commit -m "feat(sandbox): seed two-folder app with architecture and retrieval modules" --no-verify -q

  log_step "Scenario ready: diagram from a multi-component project"
  log_info "Context: web/ + api/ + SQLite, layered ARCHITECTURE.md, retrieval modules under api/src/retrieval/"
  log_info "Signals the skill should pick up:"
  log_info "  .claude/ARCHITECTURE.md: 4 layers, hybrid retrieval, SQLite, BYOK → components + data pipeline"
  log_info "  Vercel AI SDK agent loop in prose → request-flow sequence diagram"
  log_info "  docker-compose.yml: web and api services → deployment diagram"
  log_info "Action: /aitk:claude-diagram"
  log_info "Expect: .claude/DIAGRAMS.md with components, request flow, retrieval pipeline, and deployment sections"
  log_info "Expect: PNG renders under .claude/.tmp/diagrams/, one per diagram the pass wrote"
  log_info "Expect: chat output reports a verified render count, or names the check it skipped"
  log_info "Known-bad fixture: fixtures/known-bad.mmd passes every source rule and fails three ways rendered"
  log_info "  Render it to see the failure: bunx -y @mermaid-js/mermaid-cli -i fixtures/known-bad.mmd -o /tmp/known-bad.png"
  log_info "  Diagonal layout, three parallel stores in a row reading as a chain, six edges bundled on one node"
  log_info "Manual leg: whether an inspected render actually got corrected cannot be asserted here"
}
