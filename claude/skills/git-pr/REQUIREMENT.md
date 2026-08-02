---
name: git-pr
description: What pull request generation is for, the gaps it closes, and what it requires upstream of itself
---

# Git PR requirement

## Gap

Without this skill, a pull request body is written from memory of the branch rather than from its diff, so it describes the intent and omits what the work turned into. Testing boxes get ticked from intent, which records what was meant to run instead of what ran, and a reviewer trusts the list. A second push either errors on create or opens a duplicate pull request, and banned characters survive into a body the hook never sees.

## Must

- Refuse a branch name that does not conform, since the name lands on the pull request permanently and renaming it afterward breaks the link
- Derive the title and body from the commits and the diff against main, with lockfiles excluded
- Run each check before writing its line, then state the result the run reported
- Leave a box unchecked only for a human-only case, naming which human and why on the same line
- Scan the title and body for banned characters and internal phase labels as an explicit step, on top of reading the prose standard
- Detect an open pull request and edit it in place, so a follow-up push keeps the body in sync instead of failing

## Must not

- Tick a testing box from intent or from a past session. The box records a run.
- Put a request for the reviewer in the Testing list, since a request is not a result
- Create a second pull request when one is open
- Emit anything after the result line

## Guards

- Branch name does not conform: stop and route to the skill that renames
- No commits ahead of main: stop

## Out of scope

- Naming the branch, which `git-branch` owns. This skill requires a conforming name and refuses without one rather than fixing it.
- Grouping the diff into commits, which `git-stage` owns
- Pushing a later edit onto an already-open pull request, which `git-followup` owns. The overlap is real and the split is by state: this skill brings a pull request into existence and keeps it accurate, that one carries a fix onto one already under review.
