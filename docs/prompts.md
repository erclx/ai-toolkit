---
title: Prompts
description: System prompt templates for AI authoring
category: Domain references
---

# Prompts system

## Overview

Prompts are system prompt generators for AI-assisted authoring tasks. Each prompt defines a role, constraints, and output format for generating a specific artifact type. They are machine-readable specs optimized for token efficiency and deterministic output.

Select prompts can be installed into target projects via `aitk prompts install`. Only prompts registered in `prompts.toml` are installable. Toolkit-internal prompts stay in this repo only.

## Structure

```plaintext
prompts/
├── index.md          ← generated from installed files on install and sync
├── *.md              ← system prompt generators
└── prompts.toml      ← category definitions (name lists)
docs/
└── prompts.md        ← this file
```

`index.md` is a generated file. `aitk prompts install` and `aitk prompts sync` rewrite it in the target based on which prompts are present, reading each file's frontmatter for the link label and description. Do not hand-edit it in a target project.

## Categories

Prompts are organized into categories in `prompts.toml`. Each category is a named list of prompt file stems. There is no inheritance. Categories are flat file lists.

| Category    | Names                              |
| ----------- | ---------------------------------- |
| `authoring` | antigravity-workflow, claude-skill |
| `infra`     | bash-script, ci-workflow           |

## Prompts

What each prompt generates lives in its frontmatter `description`. Browse `prompts/index.md` or run `aitk prompts list` for the full catalog.

| File                      | Exportable |
| ------------------------- | ---------- |
| `antigravity-workflow.md` | Yes        |
| `bash-script.md`          | Yes        |
| `ci-workflow.md`          | Yes        |
| `claude-skill.md`         | Yes        |
| `cursor-rules.md`         | No         |
| `gemini-cli.md`           | No         |
| `meta-prompt.md`          | No         |
| `standards-reference.md`  | No         |
| `tooling-reference.md`    | No         |

## Conventions

- Frontmatter `title` and `description` are required on every prompt. See `standards/prose.md` for the style rule.
- All-caps H1 title: `# BASH SCRIPT ARCHITECT`
- All-caps H2 sections: `## ROLE`, `## CRITICAL CONSTRAINTS`
- Title case H3 subsections: `### Must Do`, `### Must Not Do`
- Every prompt includes `## ROLE`, `## CRITICAL CONSTRAINTS`, `## OUTPUT FORMAT`
- Include `## VALIDATION` when the output involves multi-step logic or edge cases

## CLI

| Command                                  | Description                                                          |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `aitk prompts install [category] [path]` | Copy prompts for a category into a project, use `all` for everything |
| `aitk prompts sync [path]`               | Update prompts already present (never adds new)                      |
| `aitk prompts list [--json]`             | Emit catalog of prompts with descriptions                            |

`aitk prompts` with no args shows a picker: `install`, `sync`, or `list`.

## Workflow

To install prompts into a new project:

```bash
aitk prompts install infra ../my-app
aitk prompts install all ../my-app
```

To sync updates to an existing project:

```bash
aitk prompts sync ../my-app
```

`sync` diffs all `.md` files already present in the target `prompts/` folder against the toolkit source. It is not category-aware. It only updates what is already there, never adds new files.

## Adding a prompt

Create a `.md` file in `prompts/` following the all-caps heading convention. Start the file with a frontmatter block containing `title` and `description` (see `standards/prose.md`). Include role, constraints, output format, at least one complete example, and a validation checklist if the output is complex.

To make a prompt installable, register it in `prompts.toml` under the appropriate category:

```toml
[infra]
names = ["bash-script", "your-new-prompt"]
```

## Adding a category

Append a new section to `prompts.toml`:

```toml
[my-category]
names = ["prompt-one", "prompt-two"]
```
