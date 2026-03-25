---
name: claude-docs
description: Updates .claude/ planning docs to reflect decisions made during the session. Use when design or requirements changed mid-cycle, after discussing a pivot, or before shipping when the session diverged from the original plan. Do NOT use for task promotion or archiving (use claude-tasks for that).
---

# Claude docs

## Guards

- If no `.claude/` directory exists, stop: `❌ No .claude/ directory found. Run aitk claude init to set up the workflow.`
- If no decisions were made in this session that differ from the original plan, stop: `✅ No doc updates needed. Session matched the original plan.`

## Step 1: read current docs

Read these in parallel, skipping any that do not exist:

- `.claude/TASKS.md`
- `.claude/REQUIREMENTS.md`
- `.claude/ARCHITECTURE.md`
- `.claude/DESIGN.md`
- `.claude/WIREFRAMES.md`

## Step 2: identify what changed

Review the session for decisions that diverged from the original plan:

- Requirements added, removed, or changed scope
- Architecture or technical decisions made or revised
- Design or UX decisions that differ from DESIGN.md or WIREFRAMES.md
- Tasks completed, blocked, or newly identified

## Step 3: update

For each doc with relevant changes, apply updates following these rules:

**TASKS.md**

- Mark completed tasks `[x]` in place within "Up next". Do not move them to Done.
- Add newly identified tasks to "Up next".
- Do not reorder, reformat, or touch tasks that did not change.

**REQUIREMENTS.md, ARCHITECTURE.md, DESIGN.md, WIREFRAMES.md**

- Update only the sections affected by session decisions.
- Do not rewrite sections unrelated to what changed.
- Follow `standards/prose.md` for all edits.

Write each updated file immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

## After completion

Output one line per file updated:

`✅ Updated: <filename>`

If no files needed changes, output:

`✅ No changes needed.`
