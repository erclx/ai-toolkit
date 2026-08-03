---
name: claude-memory-capture
description: What earns a memory file at the end of a session, the threshold that keeps the folder signal-bearing, and why capture never curates
---

# Claude memory capture requirement

## Gap

Without this skill, what a session learned dies with it, and the correction the user made in message four is re-earned next week. What does get written is a narrative of how the session went wrong rather than a rule that fires again, so a reader gets a story and no instruction. A new file lands beside one already holding the same topic, and the folder grows two entries per subject until nothing in it can be trusted as current.

The threshold is what the folder lives or dies on. A first-occurrence slip saved as feedback is noise that costs every later session a read, and a fact the repository already records is worse, because it duplicates a source that will be updated without it. From a linked worktree, writes resolved against `pwd` land in a second memory folder nothing else reads.

## Must

- Resolve every read and write at the main worktree root, so parallel worktrees write one folder
- Classify each candidate as feedback, project, user, or reference before writing
- Apply the save threshold, firing feedback only on an explicit correction or a pattern that repeated twice
- Grep the folder for an existing file on the topic and update it in place rather than adding a second
- Keep a feedback or project body to the rule, one line of why, and one line of when it fires next
- Append the row to the index so the entry is discoverable
- Report that nothing was worth capturing rather than manufacturing an entry to show work

## Must not

- Write a session narrative or a recovery account in place of the pattern
- Save a first-occurrence slip as feedback
- Create a second file on a topic the folder already holds
- Save what the repository already records in code, git history, or its instruction files
- Curate, promote, or delete an existing entry

## Guards

- No correction, confirmation, or context disclosure worth persisting: stop with a pass
- Memory folder absent at the main root: create it rather than stopping

## Out of scope

- Curating what is already in the folder, which `claude-memory-review` owns
- Promoting an entry into an instruction file or a skill body, which mutates how the agent operates and ships as its own change
