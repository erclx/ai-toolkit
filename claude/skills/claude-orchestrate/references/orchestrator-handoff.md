---
title: Orchestrator handoff runbook
description: Memory capture at the close of a session, what to write to .claude/tasks/session.md before a compaction, and what to leave to the board
---

Capture what the session learned, then write the pre-compact handoff as orchestrator. Do both before a compaction, because a compaction keeps conclusions and drops the reasoning that produced them, and no other file in the repository carries that reasoning.

1. Invoke `aitk:claude-memory-capture` and tell it this session does not commit. Capture reads the session and this handoff summarizes it, so capturing first lets the handoff cite what was written instead of restating the same lesson in prose.
2. Resolve the main worktree root with `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`, falling back to `pwd`. Write `.claude/tasks/session.md` under it.
3. Write only what a compaction destroys and no other file already carries. The board holds the ordering and what each task waits on, a task file holds its own findings, and a groundwork folder holds its track.
4. Use this shape:

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

5. Cite a commit, a task, or a file and line for every claim, so the next session can tell a read from a recall.
6. Overwrite the previous handoff rather than appending to it. A stale entry read as current is worse than no handoff.

Add a section only for content that fits none of the four and would otherwise be lost. Do not restate the board, and do not summarize the work that shipped, because git already carries it.

Step 1 exists because both other callers of capture are ship-chain skills and this session never ships. Without a call here, the session that receives every operator correction is the one session that records none. A compaction arriving with no warning takes the capture with it, and firing it once per batch of merges leaves the same window open across a long planning stretch, since a sweep runs only on a merge. The refill sweep reports the debt between handoffs so the operator knows one is owed.

Capture is told this session does not commit, so it skips routing and writes memory files alone. A routed fact lands in a context entry, which is a tracked file, and the orchestrator's boundaries forbid writing one from this session. That split is correct rather than a limitation, since a domain fact belongs to the task that owns the surface and goes in that task's Findings, while what this session produces is feedback about how to work, which is the class the memory folder keeps.
