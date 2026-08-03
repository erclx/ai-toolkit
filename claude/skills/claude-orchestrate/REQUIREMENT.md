---
name: claude-orchestrate
description: What the one warm control session owns, why it plans and reviews without building or merging, and the collision rule that binds parallelism
---

# Claude orchestrate requirement

## Gap

Without this skill, the session holding the cross-feature picture starts building, and the picture goes with it. Two features land on the same wiring seam because nobody listed their file sets against each other, and the second pull request rebases onto a tree it was never planned against. Findings from a merged pull request stay in a thread nobody re-reads, so the rule they should have changed never changes.

The queue fails in both directions. It empties and a free worker waits, or it fills with whatever is oldest rather than with what establishes a mechanism. A plan handed over unverified is the quiet one, since it goes stale from whatever merged after it was written, and a worker that trusts its account of the tree builds against a shape that no longer exists. A second orchestrator makes all of this unrecoverable, because the board is gitignored and neither session can read the other's writes.

## Must

- Read the priority file for execution order, since the index sorts by filename and states no order
- Report the state of play so the human knows what to launch, what to review, and what to merge
- Verify a plan against the tree before handing it over, counting the sites it claims and opening the files it describes
- List a candidate's file set against every track in flight, and serialize when the sets are not disjoint
- Place every finding a merged pull request produced against the surface that owns it
- Date the roadmap line from that file's last commit, so an old sequence reads as old
- Keep one planned, non-conflicting task in reserve beyond what is running

## Must not

- Implement a feature or edit any tracked file from this session
- Merge. Recommend merge or changes and leave the gate to the human.
- Spawn worker sessions with agents, since every build is meant to be an independent steerable stream
- Hand a worker anything but a plan, because scope lives there
- Run a second orchestrator against the same board
- Promote a task to fill the queue when nothing qualifies. A thin queue is a real answer.

## Guards

- Priority file absent: report the queue and say the order is unrecorded rather than inferring it from the index
- Roadmap absent: omit the roadmap line rather than asserting a version the file does not state
- Roadmap present but never committed: report the date as uncommitted, since a blank reads as a formatting slip

## Out of scope

- Writing the plan itself, which `claude-feature` owns and this session runs rather than reimplements
- Reviewing a worker's pull request, which `claude-pr-review` owns
- Entering the worktree a build runs in, which the human opens
- The operating model this enacts, which the toolkit's own docs hold
