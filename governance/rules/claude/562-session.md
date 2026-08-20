---
description: Route .claude/tasks/ session map edits to the session standard for the filename, the core sections, and what a handoff carries
paths:
  - '.claude/tasks/session-*.md'
---

# Session map standards

## What a handoff carries

- Follow this rule rather than `555-tasks.md` for a `session-` file. A handoff is not a task and carries neither `## Outcomes` nor `## Findings`.
- Never write into a file another session owns. Overwrite only the file the writing session already wrote.
- Resolve the containing folder at the main worktree root, never inside a linked worktree.
- Write only what a compaction destroys. Do not restate the board and do not summarize what shipped.
- Cite a commit, a task, or a file and line for every claim, so a reader can tell a read from a recall.

## Authority

- Follow `.claude/standards/session.md` for the filename and location, frontmatter, the core sections, and the write and read procedures. It is the single source.
