---
name: git-stage
description: What commit grouping is for, the gaps it closes, and how it differs from splitting a branch
---

# Git stage requirement

## Gap

Without this skill, a staged diff spanning several concerns lands as one commit, so a later revert takes unrelated work with it. A renamed file staged as two separate paths records an add and a delete, losing the rename git would otherwise detect. Commits also land in the order the files happened to be listed rather than the order they depend on, so a bisect stops on a commit that cannot build.

## Must

- Read the commit format reference and the prose standard before generating
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

- Composing a single commit from the whole staged diff, which `git-commit` owns
- Splitting commits across branches, which `git-split` owns. The two partition different things: this one takes a staged diff and emits commits, that one takes commits and emits branches.
- Pushing and opening the pull request, which `git-pr` owns
