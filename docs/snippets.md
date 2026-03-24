# Snippets system

## Overview

Snippets are small, reusable prompts stored as plain markdown files. Invoke them from Claude or Gemini chat via the Chrome extension, or directly in Claude Code. For authoring conventions and invocation details, see `standards/snippets.md`.

## Structure

```plaintext
snippets/
├── *.md               ← invokable prompt snippets
└── snippets.toml      ← category definitions (slug lists)
docs/
└── snippets.md        ← this file
```

## Categories

Snippets are organized into categories in `snippets.toml`. Each category is a named list of slugs. There is no inheritance; categories are flat file lists.

| Category | Slugs                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`   | chat-mode, senior-mode, claude-edit, session-notes, code-search, create-snippet, claude-steps                                                                          |
| `claude` | claude-plan, claude-review, claude-docs, claude-tell, claude-feature, claude-ui-test, claude-ux-audit, claude-figma, claude-tasks, claude-docs-sync, claude-seed-audit |

## Snippets

| Slug                | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `chat-mode`         | Session opener for tool behavior                    |
| `senior-mode`       | Senior-level judgment, discuss only                 |
| `claude-edit`       | Generate Claude Code edit prompt                    |
| `session-notes`     | Capture session decisions                           |
| `code-search`       | Generate a git grep bash script                     |
| `claude-plan`       | Plan a feature, update `.claude/` docs when done    |
| `claude-review`     | Adopt REVIEWER.md role, review changes against main |
| `claude-docs`       | Sync `.claude/` docs with session decisions         |
| `claude-tell`       | Produce doc blocks and Claude Code handoff          |
| `claude-feature`    | Scan codebase before implementing a feature         |
| `claude-ui-test`    | Manual browser verification checklist               |
| `claude-ux-audit`   | UX/UI audit of existing features                    |
| `create-snippet`    | Draft a new snippet (chat/Chrome extension)         |
| `claude-steps`      | Request step-by-step instructions for any process   |
| `claude-figma`      | Generate Figma instructions from a design spec      |
| `claude-tasks`      | Promote complete tasks and archive overflow         |
| `claude-docs-sync`  | Sync public docs with recent code changes           |
| `claude-seed-audit` | Audit seed files against toolkit source of truth    |

## CLI

| Command                                   | Description                                                        |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `aitk snippets install [category] [path]` | Copy slugs for a category into a project, use `all` for everything |
| `aitk snippets sync [path]`               | Update snippets already present (never adds new)                   |
| `aitk snippets create`                    | Create a new snippet and register it in the TOML                   |

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
# prompts for category (existing or new), then slug
# writes entry to snippets.toml and creates snippets/<slug>.md
```

## Adding a snippet

Use `aitk snippets create`; it handles both the TOML entry and the file. For manual additions or authoring best practices, refer to `standards/snippets.md`. To add manually: create a `.md` file in `snippets/` using a kebab-case slug as the filename, then add the slug to the relevant category in `snippets.toml`.

## Adding a category

Use `aitk snippets create` and select `new category` when prompted. To add manually: append a new section to `snippets.toml`:

```toml
[my-category]
slugs = ["slug-one", "slug-two"]
```
