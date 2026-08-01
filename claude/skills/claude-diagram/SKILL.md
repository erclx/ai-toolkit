---
name: claude-diagram
description: Drafts `.claude/DIAGRAMS.md` with one or more Mermaid diagrams describing the project's architecture, request flow, retrieval or data pipeline, and deployment. Reads `.claude/ARCHITECTURE.md` and `REQUIREMENTS.md` when present, falls back to a code-structure scan. Use when asked to "draw the architecture", "diagram the system", "show the components", "give me a flow chart", or "visualize the project". Do NOT use for design tokens (use `claude-design-extract`) or UI audits (use `claude-ux-audit`).
---

# Claude diagram

## Guards

- If no `.claude/ARCHITECTURE.md`, no `.claude/REQUIREMENTS.md`, and no top-level folder structure to scan, stop: `❌ No source signal. Add .claude/ARCHITECTURE.md or run inside a project folder.`

## Step 1: read sources in parallel

Read these from the project root, skipping any that do not exist:

- `.claude/ARCHITECTURE.md`: layered components, key technical decisions
- `.claude/REQUIREMENTS.md`: tech stack, MVP feature list
- `CLAUDE.md`: project type, conventions
- `package.json`, `pyproject.toml`, `Cargo.toml`: language and framework markers
- Top-level folder layout and root config files via `ls`: deploy targets, infrastructure config, component boundaries

Run all reads in parallel. Do not recurse speculatively.

## Step 2: pick which diagrams to emit

Emit a diagram only when its source signal exists. Skip the rest, do not pad the file.

- **Components** (`flowchart TB` with `subgraph` boundaries): always, when any signal exists. Shows the layered structure of the system.
- **Request flow** (`sequenceDiagram`): when prose describes a request lifecycle, an agent loop, or interaction between actors
- **Data pipeline** (`flowchart TB`): when prose mentions retrieval, ranking, queues, ETL, or pipelines
- **Deployment** (`flowchart TB`): when the top-level listing contains deploy or infrastructure config, or `.claude/ARCHITECTURE.md` has a deploy section

Stay inside `flowchart` and `sequenceDiagram`. Do not emit C4, state, ER, or class diagrams. They render inconsistently across viewers.

Follow `.claude/standards/diagrams.md` for layout, budgets, accessibility, verification, labeling, narrative, and explanation rules, or `${CLAUDE_SKILL_DIR}/../../standards/diagrams.md` when the project does not have it. `flowchart TB` is the default. Reach for `flowchart LR` only when a pipeline genuinely cannot read top-to-bottom, and call it out in the explanation paragraph.

## Step 3: write the file

Read the existing `.claude/DIAGRAMS.md` from the project root when it is present, then write to that path. Always overwrite. The prior content is what tells Step 4 which mermaid bodies this pass actually changed.

File format:

````markdown
# Diagrams

<one-paragraph note on what this file contains and which sources drove it>

## <Section title>

<one-line description of what this diagram shows>

```mermaid
<diagram type>
  accTitle: <what the diagram answers>
  accDescr: <the structure in one sentence>
  <body>
```

## <Next section>

...
````

When sources came from a code scan rather than planning prose, lead the intro paragraph with `Source: code.` and add `Fidelity is lower than prose-driven diagrams. Verify against the project's intent.`

Quote node labels containing spaces or special characters with double quotes (`A["Web shell"]`). Avoid parentheses inside labels, they break some renderers. Use `<br/>` for line breaks inside labels.

Apply the toolkit's prose bans to the entire file, including inside mermaid `subgraph` labels and node text. No em-dashes, no semicolons. Use a colon or split into two sentences instead. The standards-audit hook treats mermaid syntax as prose and will reject the file on every violation, forcing a retry per label.

## Step 4: render what this pass changed

A source that satisfies every rule in the standard can still render as a picture that asserts something false about the system. Verification runs on the image.

Render each diagram this pass wrote or changed. Skip any whose mermaid body is unchanged from the content read in Step 3, since an untouched diagram cannot develop a new render defect and the cost is linear in diagram count.

Before the first render in a project, say what is about to block:

```plaintext
Rendering to verify layout. The first run downloads the Mermaid CLI and takes about 15 seconds.
```

Write each diagram's mermaid body to its own scratch file, then render it:

```bash
mkdir -p .claude/.tmp/diagrams && bunx -y @mermaid-js/mermaid-cli -i .claude/.tmp/diagrams/<slug>.mmd -o .claude/.tmp/diagrams/<slug>.png
```

Render to PNG. An SVG export reads back as markup with no recoverable spatial meaning, so it cannot be verified. Use `bunx` when bun is available. Fall back to `npx -y @mermaid-js/mermaid-cli ...` otherwise.

Renders are verification artifacts, not deliverables. They stay in `.claude/.tmp/diagrams/` and are never committed.

When the render fails for any reason (no browser engine, no network, no package manager), continue to Step 6 and name the skipped check in the chat output. A missing renderer degrades the loop, it does not fail it.

## Step 5: read the render back

Read each PNG and judge the picture against what the diagram means to say. Follow the verification properties in `.claude/standards/diagrams.md`, or `${CLAUDE_SKILL_DIR}/../../standards/diagrams.md` when the project does not have it.

Fix the source and re-render. Stop after two correction passes on a diagram.

When a defect survives, write the diagram and name the defect in the chat output. A diagram whose author states the flaw is recoverable. A wrong diagram reported as verified is not.

## Step 6: chat output

```plaintext
📝 Wrote .claude/DIAGRAMS.md with N diagrams.

Verified N renders. <defect or skipped check, one line each, omitted when clean>

Open in any viewer with native Mermaid support (VS Code with `bierner.markdown-mermaid`, GitHub, Cursor) to render. Ask to export if you want SVG or PNG files.
```

Do not echo the diagram bodies in chat. Never report a clean verification when a render was skipped or a defect survived.

## Step 7: export on request

If the user asks to export the diagrams (`export to svg`, `give me images`, `render to png`), run:

```bash
mkdir -p .claude/review/diagrams && bunx -y @mermaid-js/mermaid-cli -i .claude/DIAGRAMS.md -o .claude/review/diagrams/diagram.png
```

Export PNG by default. Swap `diagram.png` for `diagram.svg` only when the user asks for vector, and never for the Step 4 verification path. The CLI writes one file per `mermaid` block (`diagram-1.png`, `diagram-2.png`, ...). Output line:

```plaintext
📝 Wrote N files to .claude/review/diagrams/
```
