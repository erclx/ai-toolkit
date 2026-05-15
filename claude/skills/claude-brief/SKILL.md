---
name: claude-brief
description: Drafts a `.claude/briefs/<slug>.md` handoff file for a TASKS entry. Reads the entry's outcomes, scans relevant architecture and context, and writes outcomes, constraints, files to read, sequence, test strategy, and open questions. Use when the orchestrator is preparing a worker session, or when asked to "draft a brief", "write a brief for X", or "prepare a handoff for X". Do NOT implement the task. Brief only.
---

# Claude brief

## Guards

- If no TASKS entry title or slug is provided, stop: `❌ No task named. Pass the task title or slug.`
- If the named entry does not exist in `.claude/TASKS.md`, stop: `❌ Task not found in .claude/TASKS.md.`
- If the entry already has a `Brief:` line and the target file exists, stop: `❌ Brief already exists at <path>. Edit directly or delete first.`
- Do not implement the task. Output the brief and stop.

## Step 1: read the orchestrator's context

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project conventions and behavior rules
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: decisions already made
- `.claude/TASKS.md`: locate the named entry and read its outcomes plus test strategy
- `.claude/briefs/ROADMAP.md`: parallel-safety and phase ordering, if it exists
- `.claude/context/index.md`: pick the relevant domain entries based on the task's outcomes, then read those entries

## Step 2: scan referenced surfaces

For each outcome bullet in the task entry, identify the code paths or surfaces it touches. Read the matching files. Examples:

- An outcome mentioning a UI element triggers a read of the relevant `.claude/wireframes/<surface>.md` plus the component file.
- An outcome mentioning a route handler triggers a read of that handler.
- An outcome mentioning an external integration triggers a read of the client module.

Do not speculatively recurse. Read only what the outcomes name.

## Step 3: draft the brief

Derive a 2-to-4-word kebab-case slug from the task title. Construct the brief with these sections:

- **Goal:** one paragraph stating what the worker session should accomplish and why it matters now.
- **Outcomes:** copy the task's outcome bullets verbatim.
- **Constraints:** durable rules the worker must respect (existing patterns to reuse, surfaces not to touch, performance or platform limits). Pulled from CLAUDE.md, ARCHITECTURE, and the scanned files.
- **Read first:** the exact list of files the worker should read before planning. Include line ranges when only part of a long file is relevant.
- **Sequence:** numbered steps describing the order of work at the surface level (gate, replay helper, UI wiring, copy, tests, smoke). Not file edits. The worker translates these into a plan.
- **Test strategy:** the mechanism and what it verifies. Copy from the task's `> Test strategy:` line and enrich with manual smoke detail when relevant.
- **Open questions:** numbered list of decisions the worker must resolve before implementing. Aim for three to seven. These appear in the plan as answered questions.

Follow `standards/prose.md`. No em-dashes, no semicolons, no marketing buzzwords. Keep each section scannable.

## Step 4: write the brief and link the task

Write the brief to `.claude/briefs/<slug>.md` at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`. Create the directory if it does not exist.

File format:

```markdown
# Brief: <task title>

## Goal

<one paragraph>

## Outcomes

- <bullet>
- <bullet>

## Constraints

- <bullet>

## Read first

- `path/to/file`: <reason or line range>

## Sequence

1. <step>
2. <step>

## Test strategy

<mechanism and what it verifies>

## Open questions

1. <question>
```

Then add a `Brief:` line to the task entry in `.claude/TASKS.md` directly under the title, before the existing `Plan:` line if one exists:

```markdown
### Title

Brief: .claude/briefs/<slug>.md
Plan: .claude/plans/feature-<slug>.md
```

## Step 5: output

```plaintext
📝 Wrote .claude/briefs/<slug>.md
✅ Linked .claude/TASKS.md

Next: /claude-worktree, then /claude-feature inside the worker session
```

The `.claude/briefs/` directory is gitignored. Do not stage or commit the file. The worker deletes it on ship together with the plan.

## Discussion rounds

After the brief is written, the user may re-ping with follow-up questions, scope adjustments, or pushback on the open questions. Keep chat output to a decision-help shape.

- State each pick as one-line pick plus one-line reason. Do not use section headers, context blocks, or multi-section breakdowns in chat.
- Put numbered decisions to resolve at the bottom of the response, not interleaved with findings.
- When a finding needs more than two lines to explain, update `.claude/briefs/<slug>.md` in place and point the user at the file instead.
