---
name: setup-indexes
description: Why index bootstrap is all-or-nothing per folder, what the confirmation loop protects, and why the convention block is pasted rather than written
---

# Setup indexes requirement

## Gap

Without this skill, a session bootstrapping the index system writes `index.md` into a folder and leaves the sibling frontmatter for later, so the first regen hard-errors on the first file missing a `title`. Partial coverage is not a partial success. The folder is broken until every sibling carries both fields, and the error surfaces at regen rather than at the write that caused it.

The scan is where the other failures start. A walk that does not prune reaches `node_modules`, gitignored output, and the snippets folder, which is invoked by reference rather than browsed and needs neither an index nor per-file frontmatter. A folder that already carries an `index.md` gets a second one written over the first.

One failure predates the scan. `setup-init` declines an install that wants the Claude layer without the tooling chain and names this skill as where the index system gets bootstrapped, and a body that never states the inbound route leaves the person arriving on it unable to tell whether they landed at the destination or somewhere adjacent to it.

Drafted frontmatter is a proposal, and a session that writes it before the user sees it turns a review into a cleanup. The convention block has the mirror failure. A session that paraphrases it into `CLAUDE.md` produces a copy that reads correctly and no longer matches its source, so the two drift with nothing reporting it. And a project with no `CLAUDE.md` gets one scaffolded to hold the block, which installs a file the project declined.

A fourth failure sits after the scan rather than inside it. `## Present candidates` had no branch for a scan that finds zero folders, so an empty result walked straight into the ask with nothing to choose from. `setup-init` folds this skill into the onboarding chain, and a fresh scaffold usually carries no markdown-heavy folder yet, so the ordinary onboarding run reached the undefined case.

## Must

- Bootstrap all-or-nothing per chosen folder, since a folder carrying partial frontmatter hard-errors on regen
- Prune the scan to folders a reader browses, and skip any folder already carrying an `index.md`
- Surface every drafted `title` and `description` for the user to accept, edit, or reject before anything is written
- Validate with a dry run and stop on the first reported error, before writing for real
- Paste the convention block verbatim from its single source
- Emit the closeout exactly once, whatever the seed step concluded
- State the inbound route from `setup-init`, so an install wanting the Claude layer without the tooling chain can tell it landed at the destination the chain named

## Must not

- Write a draft the user has not confirmed
- Index the snippets folder, which is read by reference rather than browsed
- Create `CLAUDE.md` to hold the convention block. Name the skip and the command that installs the file.
- Overwrite content below the frontmatter block, or touch a file the user rejected

## Guards

- A folder with fewer than the sibling threshold stays out of the candidate list unless the user names it explicitly, so the scan proposes and the user overrides
- A `CLAUDE.md` already carrying the convention section skips the seed silently rather than appending a second copy
- A scan that finds no candidate reports a one-line result and returns, skipping the ask and every step between it and the seed offer, rather than opening a prompt with nothing in it

## Out of scope

- Regenerating an index in a project that already runs the system, which `canon indexes regen` does on its own
- Wiring the lint-staged entry or the hook, which the closeout offers and the user opts into
- Installing governance rules or scaffolding a project: `setup-gov` and `setup-init`
- Writing the frontmatter conventions themselves, which the prose standard owns
