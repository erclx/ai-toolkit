---
name: git-stage
description: What commit grouping is for, the gaps it closes, and how it differs from splitting a branch
---

# Git stage requirement

## Gap

Without this skill, a staged diff spanning several concerns lands as one commit, so a later revert takes unrelated work with it. A renamed file staged as two separate paths records an add and a delete, losing the rename git would otherwise detect. Commits also land in the order the files happened to be listed rather than the order they depend on, so a bisect stops on a commit that cannot build.

The routing failure sits on top of those. A description claiming every commit request pulls in the single-concern one this skill has no grouping to do on, and a staged set carrying a hunk-level selection reaches the unstage below and comes back widened to whole files, which is the one case the staged-set rule cannot hold.

## Must

- Read the commit format reference and the prose standard before generating
- Decline the single-concern and the hunk-level staged set in the description, naming the sibling that takes each. The widening is a property of the unstage, so it cannot be fixed here and has to be routed around.
- Derive the groups from the staged diff, with lockfiles excluded from the derivation context
- Account for every staged file in the preview, so a dropped file is visible before execution
- Order the commits so a dependency lands before the file that imports it
- Keep a rename pair in one group and restage both paths together, so git still detects the rename at commit time
- Unstage everything first, then restage per group, since the incoming staged set is one undifferentiated blob
- Count each subject against the length limit and shorten before executing

## Must not

- Stage a file the user did not stage. The staged set is the input and widening it changes what ships.
- Split a rename pair across groups
- Emit anything after the result line. This runs inside a longer flow and prose here buries the next step.

## Guards

- Nothing staged: stop and name the command that stages

## Out of scope

- Composing a single commit from the whole staged diff, which `git-commit` owns. That skill commits the staged set untouched, so a hunk-level selection belongs there and never here.
- Splitting commits across branches, which `git-split` owns. The two partition different things: this one takes a staged diff and emits commits, that one takes commits and emits branches.
- Pushing and opening the pull request, which `git-pr` owns
