---
name: git-split
description: What branch splitting is for, the gaps it closes, and how it differs from grouping a staged diff
---

# Git split requirement

## Gap

Without this skill, a branch carrying unrelated commits ships as one pull request, which a reviewer reads by skimming because no single concern holds it together. Split by hand, commits get cherry-picked in an order that leaves a branch missing something it depends on. Merge order is the sharpest failure: merging the wrong branch first lands every other branch's content on main and leaves the remaining pull requests empty after rebase, with no signal that anything went wrong. Every body it writes stages under `.canon/tmp/` and leaves through `gh`, neither of which the audit hook watches, so a banned character survives into a published pull request and has to be edited on the remote.

## Must

- Refuse a dirty tree, since cherry-picking across branches abandons uncommitted work with no record of it
- Group by concern from both the commit messages and the file paths, preferring fewer branches over a branch per commit
- Classify the groups as independent or stacked before generating any command, because the base of every branch follows from that one call
- Account for every commit ahead of main in the preview
- State the merge order and the reason behind it, since the order is not recoverable from reading the pull requests afterward
- Carry the restack loop for stacked mode, where each branch is rebased onto main once the one below it merges
- Scan every generated title and body for banned characters and internal phase labels as an explicit step before opening a pull request

## Must not

- Split when one concern already covers the branch
- Rename a branch whose name already matches its concern
- Leave a commit unaccounted for. A dropped commit is silent and the branch it came from may already be gone.
- Merge the pull requests it opens

## Guards

- Dirty working tree: stop and name both recoveries
- On `main`: stop
- No commits ahead of main: stop

## Out of scope

- Partitioning a staged diff into commits, which `git-stage` owns. The two resemble each other and take different input: this one starts from commits that already exist and emits branches.
- The message on each commit, which `git-commit` owns
- Merging, which stays the user's call. The skill states the order and stops.
