---
name: git-commit
description: What commit generation is for, the gaps it closes, and where the family boundary sits
---

# Git commit requirement

## Gap

Without this skill, a commit message takes whatever shape the session settled on. The type and scope drift from the convention the history already follows, the subject runs past the length the log renders, and a lockfile diff floods the context the message is derived from so the message describes the lockfile.

## Must

- Read the commit format reference and the versioning standard before generating, so the type, the scope, and the version discipline come from one source
- Derive the message from the staged diff, with lockfiles excluded
- Show the message and its length against the limit before committing, so an over-length subject is visible while it is still cheap to fix
- Execute immediately after the preview. The tool permission dialog is the confirmation gate, and a second prompt trains the user to skim it.

## Must not

- Stage anything. What is committed has to be what the user chose to stage.
- Commit when nothing is staged
- Emit anything after the result line. A commit is a step inside a longer flow and prose here buries the next one.

## Guards

- Nothing staged: stop and name the command that stages

## Out of scope

- Splitting a mixed diff across several commits, which `git-stage` owns
- Naming the branch, which `git-branch` owns. The family shares its triggers and not its gaps: this one turns on the staged diff, the length limit, and lockfile exclusion, none of which a branch name has.
- Pushing or opening a pull request, which `git-pr` owns
