---
name: claude-orchestrate
description: What the one warm control session owns, why it plans and reviews without building or merging, and the collision rule that binds parallelism
---

# Claude orchestrate requirement

## Gap

Without this skill, the session holding the cross-feature picture starts building, and the picture goes with it. Two features land on the same wiring seam because nobody listed their file sets against each other, and the second pull request rebases onto a tree it was never planned against. Findings from a merged pull request stay in a thread nobody re-reads, so the rule they should have changed never changes.

The queue fails in both directions. It empties and a free worker waits, or it fills with whatever is oldest rather than with what establishes a mechanism. A plan handed over unverified is the quiet one, since it goes stale from whatever merged after it was written, and a worker that trusts its account of the tree builds against a shape that no longer exists. A second orchestrator makes all of this unrecoverable, because the board is gitignored and neither session can read the other's writes.

Refilling on a merge and on a thinning ready list leaves the window between them unwatched. A wave mid-build has merged nothing and has moved no rows, so both conditions stay silent across the whole build and the wave finishes into an empty queue, which lands planning on the critical path directly after the stretch where it would have cost nothing.

Writing those plans against the tree alone is the second half, since several branches are already changing the shape a plan describes. A plan carrying a bare path list rather than a constraint per in-flight track leaves the worker guessing which act each path forbids, which is the dangling citation the rule against bare paths already exists to prevent.

The session also writes surfaces it is told only how to read. Refilling the queue promotes and demotes rows in the priority file with no stated method, so a session invents one, and an inline rewrite exits clean when it matches nothing and leaves the board wrong with nothing reporting it. A row carrying prose where a plan pointer belongs costs a worker dispatch, because the ship chain refuses at its guard after the worktree is already open. A plan archived from a worker's own branch strands the pointer the board still carries, and the row reads as correct until someone follows it.

The ban on writing at all fails on a different axis, which is that nothing enforces it and a session weighs proportionality against it. A one-line prose correction found while orchestrating satisfies the root instruction to handle a small edit immediately and violates this rule, and a session given no statement of which one wins takes the smaller apparent cost and authors the change. That removes the independent pass the repository built to catch what a self-review misses, and the vantage does not come back, since no later session can review the change without re-deriving the context that produced it. A correction no open task owns has nowhere to go either, so the route matters as much as the ban.

Output drifts everywhere the contract stops. The specified shape covers invocation alone, so a sweep report, a board report, and an analysis each end in a decision the human owns and each buries it under the evidence they would have skipped. A compaction is the same failure one step earlier, since the file that survives it has a stated reader and no stated writer, and the session improvises what to save and loses the reasoning the board never held.

The runbooks the session cannot run from memory fail on a third axis, which is where they are kept. A runbook reached by an installed path is a dependency on a channel this skill does not travel on, so a project holding the plugin and running no install follows the citation to nothing, and nothing reports the break because a missing file produces no error until someone opens the path. Every one of them therefore has to ship inside the skill, the three covering the moments the loop cannot detect and the fourth holding the review trigger. That fourth one fails on an axis of its own, since it names one client's command as the way to start the loop, so a session holding a different recurring-prompt scheduler reaches no path and a client without that command reaches none either, and the file ships to every target holding the plugin.

The session also records nothing of what it learns. Both other callers of memory capture are ship-chain skills and this one never ships, so the session taking every operator correction is the session with no moment that writes one down. Hanging that moment on the merge sweep answers it and bills the operator a capture pass per batch of merges while nothing is being built, which is a cost paid on the days shipping is fastest.

## Must

- Read the priority file for execution order, since the index sorts by filename and states no order
- Report the state of play so the human knows what to launch, what to review, and what to merge
- Verify a plan against the tree before handing it over, counting the sites it claims and opening the files it describes
- List a candidate's file set against every track in flight, and serialize when the sets are not disjoint
- Place every finding a merged pull request produced against the surface that owns it
- Date the roadmap line from that file's last commit, so an old sequence reads as old
- Keep one planned, non-conflicting task in reserve beyond what is running
- Refill the queue while a wave is still building, rather than on a merge and a thinning list alone, since neither of those fires across the window planning costs nothing
- Carry a constraint naming each in-flight track's file set in every plan written from here, stating per set which of the two acts it forbids, since a bare path list leaves a broken citation in place
- Write the priority file with an editing tool that errors on a non-match, since the board is where a silent failure costs a dispatch
- Carry a plan pointer in the Plan column and a file set in the Touches column, so a row's readiness and disjointness claims stay checkable
- Re-resolve the board's plan pointers after any archive, since the archiving skill rewrites the task file and knows nothing about the board
- Lead a sweep report, a board report, and an analysis with the state, the open decisions, and the next action, keeping the evidence below them
- Write the pre-compact handoff with what no other file carries, and name the runbook that reads it back
- Capture what the session learned at the handoff rather than in the merge sweep, and have the sweep report the debt dated from the last handoff, since a capture per batch of merges bills the operator a wait while nothing ships and an undated row reads the same however long the debt has run
- Carry every runbook the session cannot run from memory inside the skill, so each citation resolves for a project holding the plugin and nothing else
- State which rule wins where the tracked-file ban collides with the root instruction on small edits, and where a correction no open task owns goes
- State the review trigger as a recurring prompt rather than as one client's command, since the runbook ships to targets running whatever client they run
- Read the handoff or the resume runbook when the human asks for that side of a compaction, since the request is the only signal available for a moment the loop cannot detect

## Must not

- Implement a feature or edit any tracked file from this session, at any size, since the ban offers no proportionality exception
- Merge. Recommend merge or changes and leave the gate to the human.
- Spawn worker sessions with agents, since every build is meant to be an independent steerable stream
- Hand a worker anything but a plan, because scope lives there
- Run a second orchestrator against the same board
- Promote a task to fill the queue when nothing qualifies. A thin queue is a real answer.
- Rewrite the board with a shell stream editor or an inline string replace, both of which exit clean when they match nothing
- Restate the board, a task file, or a groundwork folder in the pre-compact handoff, which is the padding that makes a handoff stop being read
- Specify a shape for a correction, since a format for admitting error invites ceremony where plainness is the whole value

## Guards

- Priority file absent: report the queue and say the order is unrecorded rather than inferring it from the index
- Roadmap absent: omit the roadmap line rather than asserting a version the file does not state
- Roadmap present but never committed: report the date as uncommitted, since a blank reads as a formatting slip
- This body dropped from a long session approaching a compaction: name the re-invocation and the runbook paths, since the routing lives in the body and a user-invoked skill routes nothing once it is gone

## Out of scope

- Writing the plan itself, which `claude-feature` owns and this session runs rather than reimplements
- Reviewing a worker's pull request, which `claude-pr-review` owns
- Entering the worktree a build runs in, which the human opens
- The operating model this enacts, which the toolkit's own docs hold
