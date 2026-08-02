---
title: Diagrams
subtitle: Per-kind Mermaid views loaded on demand. Start with system context.
---

# Diagrams

Per-kind Mermaid views loaded on demand. Start with system context.

## Components

- [CLI boundary](components-cli.md): Where the TypeScript command surface hands off to the bash that has not migrated, drawn from the CLI and scripts entries
- [Components](components.md): Layers inside the boundary, the tree the plugin cannot reach, and the two channels that carry content out, drawn from ARCHITECTURE.md

## Data pipeline

- [Stack resolution](data-pipeline-stacks.md): How a tooling stack resolves through its extends chain and which layer wins a duplicate path, drawn from the manifest walk
- [Context assembly](data-pipeline.md): Three loading tiers a session's context window is built from, what triggers each, and which one pays on every run

## Deployment

- [Deployment](deployment.md): Gates between a commit and a released version, drawn from the workflow files

## Request flow

- [Eval harness](request-flow-eval.md): An eval run from a person deciding to spend money through to a committed ledger row, drawn from the harness README
- [Memory lifecycle](request-flow-memory.md): How a captured pattern travels from the holding pen to a durable surface or to deletion, drawn from the two memory skills
- [Request flow](request-flow.md): Orchestrator and worker loop from plan to merge, drawn from the operating model

## System context

- [System context](system-context.md): Who the toolkit serves and what it publishes to, drawn from REQUIREMENTS.md
