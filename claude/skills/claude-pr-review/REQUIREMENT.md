---
name: claude-pr-review
description: What the independent pull request review is for, the gaps it closes, and why it posts twice
---

# Claude PR review requirement

## Gap

Without this skill, a pull request is reviewed only by the session that wrote it, which cannot see the roadmap sequence or a sibling branch in flight. Findings land in chat, where they are read once and leave the thread with no record. A review that opens and never closes is worse than none, since a reader scanning the thread cannot tell an unanswered review from a confirmed one, and the author's claim that findings are fixed is the only evidence they are.

## Must

- Post both passes. A first pass opens the review against the whole change, and a close-out confirms the prior findings landed.
- Detect the pass from the thread rather than taking it from the caller, matching the heading for equality so a neighboring comment cannot be read as a prior pass
- Scope a close-out to the commits added since the prior pass, once that commit is confirmed to still reach the head
- Apply the integration, contract, and consumer lenses a self-review structurally cannot
- Post a close-out even with nothing to report, since a first pass left unanswered reads as a review nobody closed
- Key the body file on both the pull request number and the head commit, so no two passes overwrite each other
- Scan the comment for banned characters and internal phase labels before posting, since a finding phrased against a phase label reaches a reader with no task board

## Must not

- Merge. Review and post, and leave the gate to the human.
- Publish a claim the skill did not check. A failed fetch and a rebase both strand the prior commit, and only one of them is a rebase.
- Invent a third heading, or append a number GitHub already renders
- Review local uncommitted changes
- Lecture on process. The lenses land as findings, not as asides.

## Guards

- No open pull request for the target branch: stop and route to the local review skill
- The fetch of the pull request head fails: stop rather than falling through to a full pass

## Out of scope

- Fixing what it finds, which `claude-address-review` owns. The split is by side of the channel: this one posts findings from an independent session and that one consumes them.
- Reviewing local uncommitted work, which `claude-review` owns. That one writes to disk for the session that wrote the code, and this one posts to a pull request it did not write.
- Merging, which stays the human's decision
