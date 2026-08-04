---
name: claude-address-review
description: What the review return leg is for, the gaps it closes, and why the push lands before the reply
---

# Claude address review requirement

## Gap

Without this skill, review findings are worked in whatever order the author read them and the thread never records which landed. A reply posted before the push describes code the remote does not have, so a reviewer checks the branch and finds the old version. A failing check gets treated as separate from the review, which produces a follow-up that answers every comment and leaves continuous integration red. One finding nobody can resolve stalls the rest.

A branch also goes stale from `main` moving rather than from anything the branch did. Nothing in the return leg rebases it, so the worker closes every finding, reports the pull request answered, and the branch still cannot merge. Half the resolution is mechanical and wrong to do by hand, since a generated file merged manually produces a diff the next regen discards.

## Must

- Treat a failing check as a finding alongside the review comments, so the follow-up closes both
- Handle each finding independently, so one unresolved item does not block the others
- Verify before pushing, since a red follow-up costs the reviewer a second pass
- Rebase onto `origin/main` when the branch no longer merges, after the findings are addressed and before the push, so one force-push carries both
- Rebuild a generated file through the project check rather than resolving its conflict by hand
- Push before replying, so the comment never runs ahead of the code it describes
- Map every finding to what changed, or to a one-line reason when it is a question or a conscious accept
- Post the terminal comment only when the findings are addressed and every check passes
- Scan the reply for banned characters and internal phase labels before posting, since the comment leaves for the remote unchecked

## Must not

- Merge, or read the closing comment as an approval. The author cannot approve their own pull request.
- Write a review. This skill consumes findings and does not produce them.
- Post the closing comment while a check is failing
- Reimplement the follow-up push or the doc refresh. Both have owners, and a second copy here drifts from them.
- Edit silently. A finding answered without a reply leaves the reviewer re-deriving the change from the diff.
- Take one side of a conflict wholesale. Both sides are valid content, so `--ours` or `--theirs` drops one silently and passes every check.
- Merge `main` into the branch. The repository squash-merges, so a merge commit reads as noise on the pull request.
- Guess at a hunk the tree does not settle. That case reaches the operator as an ordinary finding on the next pass only if the worker stops.

## Guards

- No open pull request for the current branch: stop
- The pull request carries no review comments or threads: stop with a pass
- A conflict needing a decision the tree does not carry: stop with the branch left on its old base

## Out of scope

- Writing the review, which `claude-pr-review` owns. The split is by side of the channel: that one posts findings from an independent session and this one is the worker's return leg.
- Staging, committing, and pushing the follow-up, which `git-followup` owns under this skill's direction
- Refreshing the `.claude/` docs the fixes made stale, which `claude-docs` owns
- Re-reviewing its own fixes, which hands back to the orchestrator
- Re-reading a rewritten branch, which `claude-pr-review` absorbs by testing whether the prior reviewed commit still reaches the head and paying for a full pass when it does not
