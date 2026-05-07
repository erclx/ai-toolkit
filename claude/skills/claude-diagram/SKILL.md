---
name: claude-diagram
description: Drafts a Mermaid diagram in `.claude/diagrams/<slug>.md` from the user's prompt. Bare invocation produces an architecture overview. A named scope (`auth flow`, `queue processing`, `how the worker fans out`) drives a sequence or flow diagram for that subsystem. Reads `.claude/ARCHITECTURE.md` and `REQUIREMENTS.md` when present, falls back to a code-structure scan. Use when asked to "draw the architecture", "diagram the auth flow", "show how X works", "give me a flow chart", or "visualize the system". Do NOT use for design tokens (use `claude-design-extract`) or UI audits (use `claude-ux-audit`).
---

# Claude diagram

## Guards

- One diagram per invocation. If the prompt names two or more independent scopes, ask the user which one before drafting.
- If no `.claude/ARCHITECTURE.md`, no `.claude/REQUIREMENTS.md`, and no top-level folder structure to scan, stop: `❌ No source signal. Add ARCHITECTURE.md or run inside a project folder.`

## Step 1: classify the prompt

Pick one mode from the user's words:

- **Overview**: bare invocation, or words like `architecture`, `overview`, `system`, `components`, `everything`, `the project`. Slug defaults to `architecture-overview`.
- **Subsystem**: the prompt names a scope, like `auth flow`, `queue processing`, `chat request`, `retrieval pipeline`, `deploy`. Slug derives from the named scope.

Slug rule: lowercase, kebab-case, max 4 words from the prompt, no filler words (`the`, `how`, `works`). Same slug means same file means overwrite.

## Step 2: read sources in parallel

For **overview** mode, read these from the project root, skipping any that do not exist:

- `.claude/ARCHITECTURE.md`: layered components, key technical decisions
- `.claude/REQUIREMENTS.md`: tech stack, MVP feature list
- `CLAUDE.md`: project type, conventions
- `package.json`, `pyproject.toml`, `Cargo.toml`: language and framework markers
- `docker-compose.yml`, `Dockerfile`, `fly.toml`, `vercel.json`: deploy topology
- Top-level folder layout via `ls`

For **subsystem** mode, locate the relevant code first via a single ripgrep against the named scope, then read the 3 to 10 most relevant files. Skip planning files unless the prompt explicitly asks for the documented intent rather than the implementation.

Run all reads in parallel. Do not recurse speculatively.

## Step 3: pick the diagram type

- Architecture overview, system topology, deployment: `flowchart` with `subgraph` boundaries
- Request lifecycle, "how X handles Y", interaction between actors: `sequenceDiagram`
- Data pipeline, queue, retrieval, ETL: `flowchart LR`

Stay inside `flowchart` and `sequenceDiagram`. Do not emit C4, state, ER, or class diagrams at v1. They render inconsistently across viewers.

## Step 4: write the diagram

Derive the slug per Step 1. Write to `.claude/diagrams/<slug>.md` from the project root. Create the directory if it does not exist. Always overwrite.

File format:

```markdown
# <Title from prompt>

<one-line description of what the diagram shows>

> Source: <prose | code | prose+code>. <one-line note on which files drove it>

\`\`\`mermaid
<diagram>
\`\`\`
```

When sources came from a code scan rather than planning prose, lead the source line with `Source: code` and add `Fidelity is lower than prose-driven diagrams. Verify against the project's intent.` after the file list.

Quote node labels containing spaces or special characters with double quotes (`A["Web shell"]`). Avoid parentheses inside labels, they break some renderers. Use `<br/>` for line breaks inside labels.

## Step 5: chat output

```plaintext
📝 Wrote .claude/diagrams/<slug>.md

Open in any viewer with native Mermaid support (VS Code with `bierner.markdown-mermaid`, GitHub, Cursor) to render.
```

Do not echo the diagram body in chat.

## Examples of slug derivation

- `architecture` → `architecture-overview`
- `the auth flow` → `auth-flow`
- `how the worker queue processes a job` → `worker-queue-processing`
- `retrieval pipeline` → `retrieval-pipeline`
- `deploy topology` → `deployment`
