---
name: claude-roadmap
description: Why versions are sequenced from the MVP list alone, what makes a version a usable increment, and the lifecycle gate that stops a second pass
---

# Claude roadmap requirement

## Gap

Without this skill, versions are invented from a sense of what should come next rather than sequenced from the scope the requirements already fixed. Each one reads as a milestone nobody can use, because the ordering follows what feels foundational instead of what a user can then do, and a version that de-risks nothing sits ahead of the subsystem the whole plan rests on. The roadmap then drifts into task-level steps, which duplicates the plan folder and goes stale the first time a file moves.

An update is where the file quietly breaks. Rewriting rows that never changed hides the one line that moved, so a reader diffing the roadmap learns nothing from it. And a project whose MVP already shipped gets its later scope sequenced here, which puts a fresh requirements pass's work into a file that only ever sequenced the MVP.

## Must

- Sequence from the MVP list in the requirements file and name it as the source
- Make every version a usable increment, stated as what the user can then do
- Order by dependency and by de-risking, placing an unproven subsystem inside the version that first needs it
- Preserve rows that still hold when updating, resequencing or splitting only where scope shifted
- Follow the reference for the document shape and version format rather than inventing one
- Report which versions changed on an update

## Must not

- Break a version into task-level steps or a file list
- Rewrite a row that did not change
- Sequence a later scope section without an explicit override from the caller
- Stage or commit the file, which is tracked but belongs to the git skills

## Guards

- Requirements file absent or carrying no MVP features: stop, because there is nothing to sequence
- A later scope section present after the MVP list: stop and name the override, since that scope belongs to a fresh requirements pass
- Neither copy of the requirements standard resolves: draft without the lifecycle gate. Refusing on a rule that could not be read stops more than it protects.

## Out of scope

- Task-level steps and file lists, which `claude-feature` and the task board own
- Writing the requirements being sequenced
- Committing the file, which the git skills own
- Deciding what to build next once the MVP list has shipped
