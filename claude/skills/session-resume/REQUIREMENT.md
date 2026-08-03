---
name: session-resume
description: Why resuming reads an index before task files, resolves scratch at the main root, and never mutates what it reports
---

# Session resume requirement

## Gap

Without this skill, a session picking up old work reconstructs state from the git log, which records what shipped and not what is queued, so finished work reads as pending and the actual next item goes unmentioned. The alternative failure is worse for a different reason. A session that reads every task file and every plan to be thorough spends the context the work needs before the work starts, and the summary arrives in a session with no room left to act on it.

From a linked worktree the shared scratch folders resolve against the worktree rather than the main root, where they are empty. That reports no tracked work on a repository carrying a full backlog, and the report is indistinguishable from the true empty case.

A resume is a read, and a session that treats it as a cleanup pass offers to archive finished entries or refresh a memory it decided was stale. Both change tracked state on the strength of a summary the user has not confirmed yet.

## Must

- Resolve the plans, memory, and tasks folders at the main worktree root
- Read the task index before any individual task file, and open only the task files the summary needs
- Preserve the index's order in the report, since the order is the priority
- Surface only the memory entries that inform the top item
- Close with one recommendation naming the first item and whether a plan backs it

## Must not

- Read the whole tasks folder to build a summary
- Offer to remove, archive, or reorder an entry. Resume reports and does not mutate.
- Update memory, which changes when a recorded fact becomes wrong rather than on a resume

## Guards

- All three surfaces absent or empty reports no tracked work and stops, rather than inventing a next step from the repository

## Out of scope

- Archiving a shipped task out of the folder: `claude-tasks`
- Archiving a plan and marking an outcome, which `claude-docs` does when the work ships
- Implementing the item it recommends, which is the next request rather than part of this one
