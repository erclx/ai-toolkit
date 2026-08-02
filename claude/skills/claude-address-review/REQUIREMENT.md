---
name: claude-address-review
description: What the review return leg is for, the gaps it closes, and why the push lands before the reply
---

# Claude address review requirement

## Gap

Without this skill, review findings are worked in whatever order the author read them and the thread never records which landed. A reply posted before the push describes code the remote does not have, so a reviewer checks the branch and finds the old version. A failing check gets treated as separate from the review, which produces a follow-up that answers every comment and leaves continuous integration red. One finding nobody can resolve stalls the rest.

## Must

- Treat a failing check as a finding alongside the review comments, so the follow-up closes both
- Handle each finding independently, so one unresolved item does not block the others
- Verify before pushing, since a red follow-up costs the reviewer a second pass
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

## Guards

- No open pull request for the current branch: stop
- The pull request carries no review comments or threads: stop with a pass

## Out of scope

- Writing the review, which `claude-pr-review` owns. The split is by side of the channel: that one posts findings from an independent session and this one is the worker's return leg.
- Staging, committing, and pushing the follow-up, which `git-followup` owns under this skill's direction
- Refreshing the `.claude/` docs the fixes made stale, which `claude-docs` owns
- Re-reviewing its own fixes, which hands back to the orchestrator
