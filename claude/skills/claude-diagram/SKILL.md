---
name: claude-diagram
description: Drafts `.claude/DIAGRAMS.md` with one or more Mermaid diagrams describing the project's architecture, request flow, retrieval or data pipeline, and deployment. Reads `.claude/ARCHITECTURE.md` and `REQUIREMENTS.md` when present, falls back to a code-structure scan. Use when asked to "draw the architecture", "diagram the system", "show the components", "give me a flow chart", or "visualize the project". Do NOT use for design tokens (use `claude-design-extract`) or UI audits (use `claude-ux-audit`).
---

# Claude diagram

## Guards

- If no `.claude/ARCHITECTURE.md`, no `.claude/REQUIREMENTS.md`, and no top-level folder structure to scan, stop: `❌ No source signal. Add ARCHITECTURE.md or run inside a project folder.`

## Step 1: read sources in parallel

Read these from the project root, skipping any that do not exist:

- `.claude/ARCHITECTURE.md`: layered components, key technical decisions
- `.claude/REQUIREMENTS.md`: tech stack, MVP feature list
- `CLAUDE.md`: project type, conventions
- `package.json`, `pyproject.toml`, `Cargo.toml`: language and framework markers
- `docker-compose.yml`, `Dockerfile`, `fly.toml`, `vercel.json`: deploy topology
- Top-level folder layout via `ls`

Run all reads in parallel. Do not recurse speculatively.

## Step 2: pick which diagrams to emit

Emit a diagram only when its source signal exists. Skip the rest, do not pad the file.

- **Components** (`flowchart` with `subgraph` boundaries): always, when any signal exists. Shows the layered structure of the system.
- **Request flow** (`sequenceDiagram`): when prose describes a request lifecycle, an agent loop, or interaction between actors.
- **Data pipeline** (`flowchart LR`): when prose mentions retrieval, ranking, queues, ETL, or pipelines.
- **Deployment** (`flowchart`): when `docker-compose.yml`, `Dockerfile`, `fly.toml`, `vercel.json`, or a deploy section in `ARCHITECTURE.md` exists.

Stay inside `flowchart` and `sequenceDiagram`. Do not emit C4, state, ER, or class diagrams. They render inconsistently across viewers.

## Step 3: write the file

Write to `.claude/DIAGRAMS.md` from the project root. Always overwrite.

File format:

````markdown
# Diagrams

<one-paragraph note on what this file contains and which sources drove it>

## <Section title>

<one-line description of what this diagram shows>

```mermaid
<diagram>
```

## <Next section>

...
````

When sources came from a code scan rather than planning prose, lead the intro paragraph with `Source: code.` and add `Fidelity is lower than prose-driven diagrams. Verify against the project's intent.`

Quote node labels containing spaces or special characters with double quotes (`A["Web shell"]`). Avoid parentheses inside labels, they break some renderers. Use `<br/>` for line breaks inside labels.

## Step 4: chat output

```plaintext
📝 Wrote .claude/DIAGRAMS.md with N diagrams.

Open in any viewer with native Mermaid support (VS Code with `bierner.markdown-mermaid`, GitHub, Cursor) to render. Ask to export if you want SVG or PNG files.
```

Do not echo the diagram bodies in chat.

## Step 5: export on request

If the user asks to export the diagrams (`export to svg`, `give me images`, `render to png`), run:

```bash
mkdir -p .claude/review/diagrams && bunx -y @mermaid-js/mermaid-cli -i .claude/DIAGRAMS.md -o .claude/review/diagrams/diagram.svg
```

Swap `diagram.svg` for `diagram.png` when raster is requested. The CLI writes one file per ```mermaid block (`diagram-1.svg`, `diagram-2.svg`, ...). Prefer `bunx`over`npx`when bun is available, fall back to`npx -y @mermaid-js/mermaid-cli ...` otherwise. Output line:

```plaintext
📝 Wrote N files to .claude/review/diagrams/
```
