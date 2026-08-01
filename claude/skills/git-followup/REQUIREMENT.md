---
name: git-followup
description: What the follow-up push is for, the gaps it closes, and how it splits from opening a pull request
---

# Git followup requirement

## Gap

Without this skill, an edit made after a pull request is already open ships as a bare push. The body still describes the scope from before the edit, so a reviewer returning to the page reads a description the diff no longer matches. A reviewer who left comments gets no reply, and when a caller has already posted its own reply, a second one lands underneath it.

## Must

- Refuse unless the branch has an upstream and an open pull request, since every later step addresses one of the two
- Delegate the message to `git-commit` rather than composing one, so a follow-up commit reads like every other commit
- Sync the body when the new commit moves the scope, and the title when the shift makes it inaccurate
- Reply on the pull request when it carries review comments, and scan that reply for the banned characters before posting. The hook watches files and never sees a comment body on its way to the remote.
- Suppress the reply when the caller owns it, and still run the push and the body sync

## Must not

- Run on `main`
- Open a pull request. A missing one is the stop condition, not a step to add.
- Post a second reply when the caller has already replied
- Emit anything after the result line

## Guards

- On `main`: stop and say to switch to a pull request branch
- Nothing changed: stop
- No upstream: stop and name both recoveries
- No open pull request: stop and route to the skill that opens one

## Out of scope

- Opening the pull request, which `git-pr` owns and `git-ship` chains
- Deciding what to fix from a review, which `claude-address-review` owns. This skill is that flow's push leg and takes the fixes as already made.
- Grouping a multi-concern diff, which `git-stage` owns. A follow-up is one concern by definition, which is why this skill stages everything into a single commit.
