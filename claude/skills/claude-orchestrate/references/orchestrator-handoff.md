---
title: Orchestrator handoff runbook
description: Memory capture at the close of a session, what to write to .claude/tasks/session.md before a compaction, what to leave to the board, and the resume invocation the file carries out
---

Capture what the session learned, then write the pre-compact handoff as orchestrator. Do both before a compaction, because a compaction keeps conclusions and drops the reasoning that produced them, and no other file in the repository carries that reasoning.

1. Invoke `aitk:claude-memory-capture` and tell it this session does not commit. Capture reads the session and this handoff summarizes it, so capturing first lets the handoff cite what was written instead of restating the same lesson in prose.
2. Run `aitk claude skills drift <commit this session started from>` and re-read any body it names before writing anything below. Nothing on the machine records that commit, so recover it from how long the session has been running with `git log -1 --format=%H --before='<duration> ago'`, rounding the duration up rather than down. A ref older than the oldest load over-reports and confirming a name costs one read of the body, so the generous end is the safe one and a guess at the exact commit is not worth making. A skill body enters a session once and re-invoking the skill replays the held copy rather than the file, so the drift is worst at exactly this moment and a name here is a body this session has been following out of date. Record what it named under `## Standing cautions`. The verb answers where the working directory carries `claude/skills/` with history behind it, which is the toolkit repository itself, and refuses by naming the absent tree anywhere else. A project consuming the plugin from a marketplace cache is that second case, so read the refusal as the boundary rather than as a fault.
3. Resolve the main worktree root with `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`, falling back to `pwd`. Write `.claude/tasks/session.md` under it.
4. Write only what a compaction destroys and no other file already carries. The board holds the ordering and what each task waits on, a task file holds its own findings, and a groundwork folder holds its track.
5. Use this shape, resolving `${CLAUDE_SKILL_DIR}/references/orchestrator-resume.md` and `${CLAUDE_SKILL_DIR}/references/orchestrator-poll.md` to absolute paths as you write it and pasting each in place of `<RESUME_RUNBOOK>` and `<POLL_RUNBOOK>`:

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

Resume by loading the orchestrator skill and asking it to resume after a compaction. This repository spells that `/aitk:claude-orchestrate` followed by the request. Following <RESUME_RUNBOOK> reaches the same place with no skill loaded at all.

That resume reads the board and stops. It restarts nothing, so the review poll is a second thing owed here, and <POLL_RUNBOOK> holds the prompt and the condition. Do not reach for `session-resume`, which reads tracked work and knows nothing about this board or the workers on it.
```

6. Cite a commit, a task, or a file and line for every claim, so the next session can tell a read from a recall.
7. Overwrite the previous handoff rather than appending to it. A stale entry read as current is worse than no handoff.

The substitution belongs in step 5 because step 7 ends the write. A reader who treats the list as finished there ships the literal placeholders, and the variable expands while this runbook renders rather than in the turn that reads the handoff back, so a path left unresolved reaches a session holding no skill as a string matching nothing. `orchestrator-poll.md` resolves its script at the same point and for the same reason.

Add a section only for content that fits none of the four and would otherwise be lost. Do not restate the board, and do not summarize the work that shipped, because git already carries it. The closing block is the one exception, and the paragraph below states why.

That block sits in this runbook and again in the file this runbook writes, which is the fix rather than a copy for a later pass to collapse. A session has to already be holding this runbook to read it, and a compaction that took the skill body took the routing to it too, so the session that most needs the resume is the one that can no longer find it. `session.md` survives that, so it carries the invocation itself. Each of the two reaches a reader the other cannot.

The requirement is a resume request to the orchestrator skill with that skill loaded first. The command the block carries is this repository's spelling rather than the only one, since the skill ships to every target holding the plugin and each runs whatever client it runs. The poll restart is named beside it because the resume performs none.

Step 1 exists because both other callers of capture are ship-chain skills and this session never ships. Without a call here, the session that receives every operator correction is the one session that records none. A compaction arriving with no warning takes the capture with it, and firing it once per batch of merges leaves the same window open across a long planning stretch, since a sweep runs only on a merge. The refill sweep reports the debt between handoffs so the operator knows one is owed.

Capture is told this session does not commit, so it skips routing and writes memory files alone. A routed fact lands in a context entry, which is a tracked file, and the orchestrator's boundaries forbid writing one from this session. That split is correct rather than a limitation, since a domain fact belongs to the task that owns the surface and goes in that task's Findings, while what this session produces is feedback about how to work, which is the class the memory folder keeps.
