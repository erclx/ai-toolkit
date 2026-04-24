---
title: Snippets
description: Reusable prompt snippets for Claude and Gemini
category: Domain references
---

# Snippets system

## Overview

Snippets are small, reusable prompts stored as plain markdown files. Invoke them from Claude or Gemini chat via the Chrome extension, or directly in Claude Code. For authoring conventions and invocation details, see `standards/snippets.md`.

## Structure

```plaintext
snippets/
├── *.md               ← base snippets
├── claude/
│   └── *.md           ← claude snippets, installed as snippets/claude/{name}.md
├── git/
│   └── *.md           ← git snippets, installed as snippets/git/{name}.md
├── aitk/
│   └── *.md           ← toolkit-internal runbooks, excluded from install
docs/
└── snippets.md        ← this file
```

Base snippets live at the root. Category snippets live in a named subfolder. The folder structure is preserved on install. A snippet at `claude/figma-steps.md` installs as `snippets/claude/figma-steps.md` and is invoked as `@snippets/claude/figma-steps`.

The `aitk` category is internal. It holds runbooks that only make sense inside the toolkit repo and is excluded from `install all`, the interactive picker, `aitk snippets list`, and explicit `aitk snippets install aitk`.

## Categories

| Category | Paths                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base`   | compact-summary, create-snippet, decision-help, research-prompt, session-notes, step-by-step, web-research                                                                                                                                       |
| `claude` | claude/feature-recap, claude/figma-steps, claude/memory-apply, claude/memory-capture, claude/memory-challenge, claude/memory-cleanup, claude/memory-discuss, claude/prose-audit, claude/standards-audit, claude/tasks-done, claude/vocab-capture |
| `git`    | git/followup                                                                                                                                                                                                                                     |
| `aitk`   | aitk/sandbox-worktree, aitk/toolkit-feedback (internal, not installable)                                                                                                                                                                         |

## Snippets

| Path                      | Purpose                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `compact-summary`         | Summarize research or findings into a scannable block                                                          |
| `create-snippet`          | Draft a new snippet (chat/Chrome extension)                                                                    |
| `decision-help`           | Pick the best option from the discussion so far, one-line pick plus short reason                               |
| `research-prompt`         | Generate a research prompt to paste into another AI chat                                                       |
| `session-notes`           | Capture session decisions                                                                                      |
| `step-by-step`            | Request step-by-step instructions for any process                                                              |
| `web-research`            | Search the web and synthesize findings into a decision-ready block                                             |
| `claude/feature-recap`    | Verify a finished implementation by listing deliverables, files touched, and tests                             |
| `claude/figma-steps`      | Generate Figma instructions from a design spec                                                                 |
| `claude/memory-apply`     | Apply per-item `Decision:` slots from the latest memory review and update statuses                             |
| `claude/memory-capture`   | Review the session and emit memory blocks across feedback, project, user, reference                            |
| `claude/memory-challenge` | Challenge every promote item in the latest memory review with absorbed, delta, and generality tests            |
| `claude/memory-cleanup`   | Sweep skipped entries from the last memory review and delete the review receipt                                |
| `claude/memory-discuss`   | Respond to question items in the latest memory review by writing `Take:` lines                                 |
| `claude/prose-audit`      | Audit a file's prose against `standards/prose.md`                                                              |
| `claude/standards-audit`  | Audit changed files against applicable authoring standards (prose, skill, readme, branch, pr)                  |
| `claude/tasks-done`       | Remove completed task blocks, delete referenced plan files, and sync the placeholder                           |
| `claude/vocab-capture`    | Append new rule-writing terms from the session to `wiki/rule-writing-vocabulary.md`                            |
| `git/followup`            | Stage, commit, and push a small self-review edit on the current PR branch                                      |
| `aitk/sandbox-worktree`   | Provision a sandbox scenario from the current tree and launch Claude against it with the worktree's plugin dir |
| `aitk/toolkit-feedback`   | Format a session-context paste-back report about an issue with the ai/toolkit                                  |

## CLI

| Command                                                 | Description                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `aitk snippets install [category] [path]`               | Copy slugs for a category into a project, use `all` for everything |
| `aitk snippets sync [path]`                             | Update snippets already present (never adds new)                   |
| `aitk snippets create`                                  | Create a new snippet file in the correct category folder           |
| `aitk snippets list [--categories\|--entries] [--json]` | Emit catalog of categories and entries                             |

`aitk snippets` with no args shows a picker: `install`, `sync`, `create`, or `list`.

## Workflow

To install all snippets into a new project:

```bash
aitk snippets install all ../my-app
```

To install a specific category only:

```bash
aitk snippets install base ../my-app
aitk snippets install claude ../my-app
```

To sync updates to an existing project:

```bash
aitk snippets sync ../my-app
```

`sync` diffs all `.md` files already present in the target `snippets/` folder against the toolkit source. It is not category-aware, it only updates what is already there, never adds new files.

To create a new snippet:

```bash
aitk snippets create
# prompts for category (existing folder, new folder, or base root)
# confirms the derived slug before writing
# creates snippets/{category}/{name}.md or snippets/{name}.md for base
```

## Adding a snippet

Use `aitk snippets create`. It handles the file and folder creation. For manual additions or authoring best practices, refer to `standards/snippets.md`. To add manually: create a `.md` file in the correct folder using a kebab-case name, following the path conventions above.

## Adding a category

Use `aitk snippets create` and select `new category` when prompted. To add manually: create a new subfolder under `snippets/` with a kebab-case name and add your snippet files inside it.
