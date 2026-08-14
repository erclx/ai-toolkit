---
name: git-commit
description: What commit generation is for, the gaps it closes, and where the family boundary sits
---

# Git commit requirement

## Gap

Without this skill, a commit message takes whatever shape the session settled on. The type and scope drift from the convention the history already follows, the subject runs past the length the log renders, and a lockfile diff floods the context the message is derived from so the message describes the lockfile.

A second failure is routing rather than shape. A plain request to commit reaches this skill and its grouping sibling alike, and the sibling's first step is to unstage everything and restage whole files, so a selection staged hunk by hand comes back widened to the files it sat in. The user reviewed one thing and shipped another, and nothing in the run says the set changed.

## Must

- Read the commit format reference and the versioning standard before generating, so the type, the scope, and the version discipline come from one source
- Derive the message from the staged diff, with lockfiles excluded
- Show the message and its length against the limit before committing, so an over-length subject is visible while it is still cheap to fix
- Execute immediately after the preview. The tool permission dialog is the confirmation gate, and a second prompt trains the user to skim it.
- Claim the single-concern and the hunk-level staged set in the description, and name the sibling for the multi-concern one. A boundary stated only here routes nothing, since the description is the field the choice is made from.

## Must not

- Stage anything. What is committed has to be what the user chose to stage.
- Commit when nothing is staged
- Emit anything after the result line. A commit is a step inside a longer flow and prose here buries the next one.

## Guards

- Nothing staged: stop and name the command that stages

## Out of scope

- Splitting a mixed diff across several commits, which `git-stage` owns. That skill restages whole files, so a hunk-level selection survives here and not there, and both descriptions carry the difference rather than leaving it stated only in these two files.
- Naming the branch, which `git-branch` owns. The family shares its triggers and not its gaps: this one turns on the staged diff, the length limit, and lockfile exclusion, none of which a branch name has.
- Pushing or opening a pull request, which `git-pr` owns
