# Prompts system

## Overview

Prompts are system prompt generators for AI-assisted authoring tasks. Each prompt defines a role, constraints, and output format for generating a specific artifact type. They are machine-readable specs optimized for token efficiency and deterministic output.

Select prompts can be installed into target projects via `aitk prompts install`. Only prompts registered in `prompts.toml` are installable. Toolkit-internal prompts stay in this repo only.

## Structure

```plaintext
prompts/
├── *.md              ← system prompt generators
└── prompts.toml      ← category definitions (name lists)
docs/
└── prompts.md        ← this file
```

## Categories

Prompts are organized into categories in `prompts.toml`. Each category is a named list of prompt file stems. There is no inheritance. Categories are flat file lists.

| Category    | Names                              |
| ----------- | ---------------------------------- |
| `authoring` | antigravity-workflow, claude-skill |
| `infra`     | bash-script, ci-workflow           |

## Prompts

| File                      | Generates                                    | Exportable |
| ------------------------- | -------------------------------------------- | ---------- |
| `antigravity-workflow.md` | Antigravity workflow markdown files          | Yes        |
| `bash-script.md`          | Production-grade Bash scripts with visual UI | Yes        |
| `ci-workflow.md`          | GitHub Actions CI workflow files             | Yes        |
| `claude-skill.md`         | Claude Code skill SKILL.md files             | Yes        |
| `cursor-rules.md`         | Cursor .mdc rule files                       | No         |
| `gemini-cli.md`           | Gemini CLI TOML command files                | No         |
| `meta-prompt.md`          | System prompts from raw user ideas           | No         |
| `standards-reference.md`  | Standards reference markdown files           | No         |
| `tooling-reference.md`    | Tooling stack reference.md files             | No         |

## Conventions

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

`aitk prompts` with no args shows a picker: `install` or `sync`.

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

Create a `.md` file in `prompts/` following the all-caps heading convention. Include role, constraints, output format, at least one complete example, and a validation checklist if the output is complex.

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
