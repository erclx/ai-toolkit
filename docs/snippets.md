# Snippets system

## Overview

Snippets are small, reusable prompts stored as plain markdown files. Invoke them from Claude or Gemini chat via the Chrome extension, or directly in Claude Code. For authoring conventions and invocation details, see `standards/snippets.md`.

## Structure

```plaintext
snippets/
├── *.md               ← base snippets (no category prefix)
├── claude/
│   └── *.md           ← claude snippets, installed as claude-{name}.md
docs/
└── snippets.md        ← this file
```

Base snippets live at the root with no prefix. Category snippets live in a named subfolder; the folder name becomes the slug prefix on install. A snippet at `claude/docs.md` installs as `claude-docs.md` and is invoked as `@claude-docs`.

## Categories

| Category | Slugs                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `base`   | chat-mode, senior-mode, session-notes, code-search, create-snippet                                            |
| `claude` | claude-edit, claude-figma, claude-prose-audit, claude-seed-audit, claude-steps, claude-tasks, claude-ux-audit |

## Snippets

| Slug                 | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `chat-mode`          | Session opener for tool behavior                                         |
| `senior-mode`        | Senior-level judgment, discuss only                                      |
| `session-notes`      | Capture session decisions                                                |
| `code-search`        | Generate a git grep bash script                                          |
| `create-snippet`     | Draft a new snippet (chat/Chrome extension)                              |
| `claude-edit`        | Generate Claude Code edit prompt                                         |
| `claude-figma`       | Generate Figma instructions from a design spec                           |
| `claude-prose-audit` | Audit a file's prose against `standards/prose.md`                        |
| `claude-seed-audit`  | Audit seed files against toolkit source of truth                         |
| `claude-steps`       | Request step-by-step instructions for any process                        |
| `claude-tasks`       | Promote complete tasks, archive overflow, and fill the empty placeholder |
| `claude-ux-audit`    | UX/UI audit of existing features                                         |

## CLI

| Command                                   | Description                                                        |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `aitk snippets install [category] [path]` | Copy slugs for a category into a project, use `all` for everything |
| `aitk snippets sync [path]`               | Update snippets already present (never adds new)                   |
| `aitk snippets create`                    | Create a new snippet file in the correct category folder           |

`aitk snippets` with no args shows a picker: `install`, `sync`, or `create`.

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

Use `aitk snippets create`; it handles the file and folder creation. For manual additions or authoring best practices, refer to `standards/snippets.md`. To add manually: create a `.md` file in the correct folder using a kebab-case name, following the path conventions above.

## Adding a category

Use `aitk snippets create` and select `new category` when prompted. To add manually: create a new subfolder under `snippets/` with a kebab-case name and add your snippet files inside it.
