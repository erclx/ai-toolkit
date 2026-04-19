---
name: session-resume
description: Resumes a previous session by reading tracked work and relevant context. Use when starting a new session, or when asked to "pick up where we left off", "what was I working on", or "resume".
---

# Session resume

## Step 1: read tracked work

Resolve `.claude/plans/` and `.claude/memory/` at the main worktree root per Worktrees in `CLAUDE.md`. Resolve `TASKS.md` at the current project root.

Read these in parallel, skipping any that do not exist:

- `.claude/TASKS.md`: the backlog
- `.claude/plans/*.md`: execution detail for in-progress tasks
- `.claude/memory/MEMORY.md` and any memory files relevant to the top backlog item

If all three surfaces are absent or empty, stop: `✅ No tracked work found. Start a new task.`

## Step 2: summarize

Output three sections:

**Up next:** one line per task in `TASKS.md` under "Up next", preserving order.

**Active plans:** one line per file in `.claude/plans/`, linking each to its task in `TASKS.md`. Say "None" if empty.

**Relevant context:** two or three memory entries that inform the top backlog item. Skip if none apply.

## Step 3: recommend

End with one line: `Start with: <first Up next item>` and note whether it has a linked plan.

Do not offer to remove entries. Completed blocks are removed from `TASKS.md` when work ships. The git log is the authoritative record of shipped work. Plan files are deleted per the plan lifecycle rule in `CLAUDE.md`. Memory is updated only when a recorded fact becomes wrong, never on resume.
