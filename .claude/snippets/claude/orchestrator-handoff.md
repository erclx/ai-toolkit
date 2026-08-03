Write the pre-compact handoff as orchestrator. Do this before a compaction, because a compaction keeps conclusions and drops the reasoning that produced them, and no other file in the repository carries that reasoning.

1. Resolve the main worktree root with `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`, falling back to `pwd`. Write `.claude/tasks/session.md` under it.
2. Write only what a compaction destroys and no other file already carries. The board holds the ordering and what each task waits on, a task file holds its own findings, and a groundwork folder holds its track.
3. Use this shape:

```markdown
---
title: Session map
description: <what the board cannot show, and the date it was written>
---

# Session map

<one line marking the file throwaway and naming the board as the real source>

## State

<what is clean, what is running, what is open, and any untracked file that needs committing>

## Decisions taken under delegated authority

<each decision and why it went that way, so nobody re-proposes it>

## Mistakes worth not repeating

<what went wrong and the rule it yields>

## Standing cautions

<commands that lie, tools that measure the wrong tree, and anything unbacked>
```

4. Cite a commit, a task, or a file and line for every claim, so the next session can tell a read from a recall.
5. Overwrite the previous handoff rather than appending to it. A stale entry read as current is worse than no handoff.

Add a section only for content that fits none of the four and would otherwise be lost. Do not restate the board, and do not summarize the work that shipped, because git already carries it.
