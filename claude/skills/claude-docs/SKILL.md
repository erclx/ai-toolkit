---
name: claude-docs
description: Updates `.claude/` planning docs to reflect decisions made during the session. Use when design or requirements changed mid-cycle, after discussing a pivot, or before shipping when the session diverged from the original plan. Do NOT use for task promotion or archiving. Edit `.claude/TASKS.md` directly for that.
---

# Claude docs

## Guards

- If no `.claude/` directory exists, stop: `❌ No .claude/ directory found. Run aitk claude init to set up the workflow.`
- If no decisions were made in this session that differ from the original plan, stop: `✅ No doc updates needed. Session matched the original plan.`

## Step 1: read current docs

Read these in parallel from the current worktree root (`pwd`), not the main worktree root. These are tracked files and edits must commit with the branch. Skip any that do not exist:

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

## Step 3.5: write context entries

Derive `<slug>` from the current branch name (replace `/` with `-`). Read the plan file at `.claude/plans/feature-<slug>.md` resolved against the main worktree root. Skip this step silently if the plan does not exist or contains no `## Context updates` section.

For each bullet in the Context updates section (format: `- <domain>: <reason>`):

- If `.claude/context/<domain>.md` exists at `pwd`, identify which sections relate to the diff and rewrite only those sections from the diff content. Same pattern as `docs-sync`. Do not touch unrelated sections.
- If `.claude/context/<domain>.md` does not exist, create it with frontmatter (`title` derived from the domain, `description` from the plan reason) and seed content drafted from the diff. Follow `standards/prose.md`.

Write each entry immediately. Output one line per file:

`✅ Context: .claude/context/<domain>.md`

After all entries are written, output a one-line reminder:

`💡 Run aitk indexes regen to update .claude/context/index.md`

Skip the reminder if no entries were written.

## Step 4: sweep consumed scratch

Sweep only scratch that was actually consumed this session. Resolve all paths at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.

**Plans.** For each task block marked `[x]` in Step 3, check for a `Plan:` line directly under the title. Parse the path. If it points inside `.claude/plans/` and the file exists, delete it. If the path is outside `.claude/plans/`, warn and skip. Mirrors the `snippets/claude/tasks-done.md` pattern.

**Reviews.** Derive `<slug>` from the current branch name (replace `/` with `-`). If `.claude/review/review-<slug>.md` exists, delete it. `claude-review` writes with this convention. Do not sweep any other `review-*.md` file.

Do not sweep `ui-checklist-*.md` (pending human verification) or `ux-audit-*.md` (standalone deliverable).

Output one line per file removed:

`🧹 Deleted: <path>`

If nothing qualifies, skip this step silently.

## After completion

Output one line per file updated:

`✅ Updated: .claude/<filename>`

If no files were updated and nothing was swept, output:

`✅ No changes needed.`
