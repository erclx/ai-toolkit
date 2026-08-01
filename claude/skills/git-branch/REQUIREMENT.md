---
name: git-branch
description: What branch naming is for, the gaps it closes, and where the family boundary sits
---

# Git branch requirement

## Gap

Without this skill, a branch name is invented once per session. The type prefix drifts from what the history already carries, the name runs past the width a pull request list renders, and a rename lands on a branch that already exists on the remote, which detaches every open pull request pointing at it.

## Must

- Read the branch format reference before generating, so the type vocabulary and the length limit come from one source
- Derive the name from the commits ahead of main when the invocation carries no description
- Resolve whether the branch exists on the remote before proposing a rename, since the hazard is invisible from local state
- Show the name and its length against the limit before renaming
- Execute immediately after the preview. The tool permission dialog is the confirmation gate.

## Must not

- Rename `main` or `master`
- Rename when the current name already conforms. The skill is chained, so a conforming name has to pass through rather than churn the branch.
- Rename a branch that exists on the remote. Local rename plus force push is not the same operation and it breaks the pull request.
- Emit anything after the result line

## Guards

- On a protected branch: stop and say the branch is protected
- Name already conforms: stop with a success marker, not a failure, since a chained caller continues past it
- No commits and no description: stop and name both missing inputs
- Branch exists on the remote: stop and route to the surface that preserves the pull request link

## Out of scope

- The commit message, which `git-commit` owns
- Pushing and opening the pull request, which `git-pr` owns. That skill reads a conforming name as a precondition and refuses without one, so this skill runs first.
- Splitting a branch whose commits span concerns, which `git-split` owns
