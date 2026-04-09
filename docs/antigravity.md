# Antigravity system

## Overview

Antigravity workflows give the AI agent domain-specific instructions for a project. They live in `.agent/workflows/` at the target project root and are invoked by slash commands or intent matching. The toolkit maintains a gold-standard set of these workflows that can be synced to any project.

## Structure

```plaintext
antigravity/
├── workflows/             ← source workflows (.md)
└── workflows.toml         ← manifest grouping workflows
scripts/
└── manage-antigravity.sh  ← entry point (aitk antigravity)
```

## Workflows

Workflows are grouped by concern in `workflows.toml`:

| Group    | Covers                                               |
| -------- | ---------------------------------------------------- |
| `git`    | Daily dev workflow automation (commit, branch, ship) |
| `docs`   | README and docs sync                                 |
| `review` | AI-assisted review, planning, and UI verification    |
| `all`    | Installs every workflow defined in the manifest      |

## CLI

| Command                                   | What it does                               |
| ----------------------------------------- | ------------------------------------------ |
| `aitk antigravity install [group] [path]` | Install a set of workflows to a project    |
| `aitk antigravity sync [path]`            | Update workflows already present in target |

`aitk antigravity` with no args shows an interactive picker for `install` or `sync`. The install command prompts to select a group before writing.

## Workflow

To set up Antigravity for a new project:

```bash
aitk antigravity install all ../my-app
# copies workflows matching the 'all' group into ../my-app/.agent/workflows/
```

To sync updates to an existing project:

```bash
aitk antigravity sync ../my-app
# diffs workflows already present, proposes updates
```

## Adding a workflow

Create a `.md` file in `antigravity/workflows/` adhering to `prompts/antigravity-workflow.md`. Open `antigravity/workflows.toml` and add the filename to the appropriate group array. Run `aitk antigravity sync` to update an existing project, or `aitk antigravity install` to push to new projects.

## Notes

- `aitk antigravity install` creates `.agent/workflows/` if it doesn't exist
- `aitk antigravity sync` only updates files already present. It never adds missing ones
- Workflows that refer to toolkit-internal infrastructure should not be added to `workflows.toml` groups
