# Snippets system

## Overview

Snippets are small, reusable prompts stored as plain markdown files. Invoke them from Claude or Gemini chat via the Chrome extension, or directly in Claude Code. For authoring conventions and invocation details, see `standards/snippets.md`.

## Structure

```plaintext
snippets/
├── *.md               ← base snippets
├── claude/
│   └── *.md           ← claude snippets, installed as snippets/claude/{name}.md
docs/
└── snippets.md        ← this file
```

Base snippets live at the root. Category snippets live in a named subfolder. The folder structure is preserved on install. A snippet at `claude/figma.md` installs as `snippets/claude/figma.md` and is invoked as `@snippets/claude/figma`.

## Categories

| Category | Paths                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `base`   | compact-summary, senior-mode, session-notes, create-snippet, web-research                                   |
| `claude` | claude/figma, claude/prose-audit, claude/research-prompt, claude/steps, claude/tasks-add, claude/tasks-done |

## Snippets

| Path                     | Purpose                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `senior-mode`            | Senior-level judgment, discuss only                                                   |
| `session-notes`          | Capture session decisions                                                             |
| `create-snippet`         | Draft a new snippet (chat/Chrome extension)                                           |
| `web-research`           | Search the web and synthesize findings into a decision-ready block                    |
| `compact-summary`        | Summarize research or findings into a compact-summary scannable block                 |
| `claude/figma`           | Generate Figma instructions from a design spec                                        |
| `claude/prose-audit`     | Audit a file's prose against `standards/prose.md`                                     |
| `claude/research-prompt` | Generate a research prompt to paste into another AI chat                              |
| `claude/steps`           | Request step-by-step instructions for any process                                     |
| `claude/tasks-add`       | Add a new task block to the "Up next" queue                                           |
| `claude/tasks-done`      | Archive completed task blocks, delete referenced plan files, and sync the placeholder |

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
