---
name: canon-rollout
description: Why one skill carries both roles of an outbound wave, and where its boundary sits against the seven skills that operate inside a target
---

# Canon rollout requirement

## Gap

Without this skill, a toolkit change reaches its consuming projects by hand. One measured pass across four targets took four hand-written `cd <path> && claude --bg` invocations, each carrying a brief composed by hand from that project's review. Nothing enumerated the targets, nothing derived the brief, and nothing applied a convention across the set.

The conventions were already settled and reached none of the four. The branch and title shape was answered and reconfirmed, and the four pull requests carried four titles across two scopes, neither of them the settled one, with three naming the toolkit in the half of the shape that withholds it. A convention nothing applies holds only where somebody remembers it.

The return leg dead-ends outside this repository. A review that posts a finding on a target's pull request has to reach the session holding that branch, and every dispatch guessed instead. All four sessions that opened those pull requests were still alive holding their worktrees hours later, two fresh addressers were sent over them, one refused on the worktree lock, and one cut a second worktree on the same branch, which would have put two sessions pushing to one ref.

A wave ends without telling the operator what to do. Reading where four targets stood took a hand-written shell loop over four repositories, re-run three times as reviews landed, and every status line it produced named a repository and a number and no link. Merging is the one act only the operator performs, and they reached each result by navigating to it by hand.

A worker's reply reads as done when it is not. One pull request's fix for two minor findings closed both and introduced four more, all in prose the fix added, including a claim about a workflow that runs on a trigger it does not declare. A loop that closes a target on the worker's word merges that.

## Must

- Enumerate the targets from the record the install writes, with the sweep as the fallback and its stated bound read before any count is trusted, since a hand census of this population was wrong in both directions at once
- Write the branch and the title from a fixed shape rather than leaving either to the dispatched session, since the settled convention reached none of four hand-driven repairs
- Carry one line in each target's body naming the toolkit as the source and where to change the content upstream, since a reader in that repository has no other route to the fact that a local edit is lost at the next wave
- Name no toolkit version in any target's body, since the install stamp in that target already records `syncedAt` and a sha256 per synced file and a version string is the copy that goes stale
- Dispatch one worker per target, with the branch checked as unclaimed in that target before the launch
- Branch from the clone that is current rather than from whichever the record names first, since a working copy answers what that machine last pulled rather than what the target holds
- Resolve who holds a branch before dispatching an addresser, and dispatch a fresh one only where the resolver reports the owning session gone
- Address every finding whatever its severity, and close a target only when a narrow re-review posts `## Review closed`
- Name a pull request URL on every line that reports a target, at dispatch and at hand-back both
- Close a wave by naming every target with its URL, review heading, CI state, and what is owed, the targets needing nothing included

## Must not

- Merge anything, in either role, at any size. The operator holds that gate over every role rather than as a setting on a wave.
- Reimplement what `canon targets list`, `canon targets pulls`, or `canon sessions list --repository` already answers. Each is a shipped verb this body reads under `CANON_NON_INTERACTIVE=1`.
- Restate the in-target diagnosis and routing that `canon-operator` owns, or the review, address, and worktree procedures the three skills named below own
- Read or write this repository's task board. The board is `role-orchestrator`'s subject and a wave is not a row on it.
- Bound the review and address loop with a count. The bound was declined with its failure mode stated, and what guards the loop is the orchestrator reviewing every round itself.
- Edit a managed file in a target by hand rather than through the `canon` verb that owns it
- Be a skill nothing invokes but its author typing the name. Nothing else routes to it, since it carries `disable-model-invocation: true` and no sibling body names it, so a wave that only ever runs when somebody types the name is the signal that the loop never replaced the hand-driven pass it was built against.

## Guards

- `gh` absent: stop, since no target's pull request can be read or opened
- The target index reads as unknown with no sweep behind it: stop and name the reason, rather than reporting a population of zero
- The claim check refuses or comes back with either readability flag false: treat the target as unverified rather than clear and hand it to the operator
- Every clone of a target is behind its remote: refuse that target rather than branching from a stale base
- More than one session holds a target's branch: report the ambiguity and stop, rather than sending findings to whichever row came first

## Out of scope

- This repository's own board, queue, and worker dispatch, which `role-orchestrator` holds
- The role a session building one branch under one plan in this repository takes, which `role-worker` holds. A rollout worker does not take it, since that body resolves session scratch against a main worktree root a target does not carry.
- Entering the worktree, which `session-worktree` owns, including the branch collision tests it runs before entry
- Diagnosing what a target is behind on and routing each finding to its command, which `canon-operator` owns
- Posting a review to a pull request and moving its heading, which `review-pr` owns
- Answering a posted review inside the target, which `review-address` owns
- The commit and the pull request mechanics, which the `git-*` family owns
