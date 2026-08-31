---
title: Orchestrator handoff runbook
description: The two sections an orchestrating session adds over the shared session map, how capture runs from a session that never commits, and the resume invocation the file carries out
---

Write the pre-compaction handoff as orchestrator. Invoke `canon:session-map` for the generic half, which is the filename, the three core sections, the write procedure, the drift step and the ref it reads, and the citation rule. Everything below is the extension this role adds over that core, and none of it belongs to a session holding no delegated authority.

Settle all three steps below before the door writes, so one write carries the core and the extension together. The door reports the map as written and knows nothing of this role, so its success line ends the generic half rather than this runbook, and a session that stops there ships a map missing both of the things this file exists to add.

1. Tell the door this session does not commit, which is the caveat its capture step takes and passes to `canon:claude-memory-capture`.
2. Add `## Decisions taken under delegated authority` directly after `## State`, holding each decision and why it went that way, so nobody re-proposes it. It sits there rather than after the core because a decision is read against the state it was taken in.
3. Close the file with the block below, resolving `${CLAUDE_SKILL_DIR}/references/orchestrator-resume.md` and `${CLAUDE_SKILL_DIR}/references/orchestrator-poll.md` to absolute paths as you write it and pasting each in place of `<RESUME_RUNBOOK>` and `<POLL_RUNBOOK>`:

```markdown
Resume by loading the orchestrator skill and asking it to resume after a compaction. This repository spells that `/canon:claude-orchestrate` followed by the request. Following <RESUME_RUNBOOK> reaches the same place with no skill loaded at all.

That resume reads the board and stops. It restarts nothing, so the review poll is a second thing owed here, and <POLL_RUNBOOK> holds the prompt and the condition. Do not reach for `session-resume`, which reads tracked work and reports the newest map without restarting this loop.
```

The delegated-authority section is the orchestrator's alone because a worker holds no delegation to have exercised, and a section a session cannot fill teaches its reader to skip the file. The closing block is the orchestrator's for the same reason from the other direction: it restarts a review poll no other role runs.

The substitution belongs in step 3 because that step ends the write. A reader who treats the list as finished elsewhere ships the literal placeholders, and the variable expands while this runbook renders rather than in the turn that reads the handoff back, so a path left unresolved reaches a session holding no skill as a string matching nothing. `orchestrator-poll.md` resolves its script at the same point and for the same reason.

That block sits in this runbook and again in the file this runbook writes, which is the fix rather than a copy for a later pass to collapse. A session has to already be holding this runbook to read it, and a compaction that took the skill body took the routing to it too, so the session that most needs the resume is the one that can no longer find it. The map survives that, so it carries the invocation itself. Each of the two reaches a reader the other cannot.

The requirement is a resume request to the orchestrator skill with that skill loaded first. The command the block carries is this repository's spelling rather than the only one, since the skill ships to every target holding the plugin and each runs whatever client it runs. The poll restart is named beside it because the resume performs none.

Step 1 exists because both other callers of capture are ship-chain skills and this session never ships. Without a call here, the session that receives every operator correction is the one session that records none. A compaction arriving with no warning takes the capture with it, and firing it once per batch of merges leaves the same window open across a long planning stretch, since a sweep runs only on a merge. The refill sweep reports the debt between handoffs so the operator knows one is owed.

Step 1 varies the door rather than replacing it, which is why the door is invoked first and this runbook states only what differs. The generic half moved out whole, the drift step and its ref recovery with it, so nothing here restates a step the door already carries and the two cannot disagree.

Capture is told this session does not commit, so it skips routing and writes memory files alone. A routed fact lands in a context entry, which is a tracked file, and the orchestrator's boundaries forbid writing one from this session. That split is correct rather than a limitation, since a domain fact belongs to the task that owns the surface and goes in that task's Findings, while what this session produces is feedback about how to work.
