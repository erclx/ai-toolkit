---
title: Agents
description: CLI catalog and invocation rules for agents
category: Agent surface
---

# Agents

CLI catalog and invocation rules for agents working in this repository.

This doc is an index of what an agent can run and how to run it cleanly from a script. It does not cover domain behavior. Read `CLAUDE.md` for project behaviors and load the matching `.claude/skills/aitk-*` skill when working inside a domain.

## Invocation rules

See `CLAUDE.md` design principles. They apply to every command below.

## Command catalog

Full help: `aitk <command> --help`.

### Project-level

| Command                  | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `aitk init [path]`       | Bootstrap a project with selected toolkit domains |
| `aitk sync [path]`       | Sync all installed domains in a target project    |
| `aitk sandbox [cat:cmd]` | Run sandbox scenarios (interactive or routed)     |
| `aitk sandbox reset`     | Reset sandbox to baseline                         |
| `aitk sandbox clean`     | Wipe the sandbox                                  |

### Domain commands

Each domain exposes a consistent shape where applicable: `list`, `install`, `sync`, `create`.

| Domain        | Subcommands                                                 |
| ------------- | ----------------------------------------------------------- |
| `tooling`     | `list`, `sync`, `ref`, `create`                             |
| `snippets`    | `list`, `install`, `sync`, `create`                         |
| `standards`   | `list`, `install`, `sync`                                   |
| `prompts`     | `list`, `install`, `sync`                                   |
| `gov`         | `list`, `install`, `sync`, `build`                          |
| `claude`      | `init`, `sync`, `seeds list`, `roles list`, `prompt`, `gov` |
| `antigravity` | `install`, `sync`                                           |
| `wiki`        | `init`                                                      |

Common patterns:

- `list --json` → machine-readable catalog on stdout.
- `install <name> <path>` → install a specific entry into a target project.
- `sync <path>` → reapply all installed entries in a target project.
- `create [name]` → scaffold a new authoring entry in this repo.

### Sandbox scenarios

Scenarios live under `scripts/sandbox/`. Route non-interactively with `SANDBOX_SCENARIO`:

```bash
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling
```

Scenario categories: `infra:*` (domain flows), `git:*`, `scaffold:*`. `create` scenarios require interactive input and loop on empty input, so skip them in automated runs.

## Runtime catalogs

Use these to discover what's available instead of hardcoding names.

| Command                         | Returns                                      |
| ------------------------------- | -------------------------------------------- |
| `aitk tooling list --json`      | Stacks, extends chain, dep and script counts |
| `aitk snippets list --json`     | Snippet slugs and folders                    |
| `aitk standards list --json`    | Standards docs                               |
| `aitk prompts list --json`      | Prompts with descriptions                    |
| `aitk gov list --json`          | Governance stacks and rule sets              |
| `aitk claude seeds list --json` | Seed doc sources with content                |
| `aitk claude roles list --json` | Role prompt sources with content             |

## Non-interactive examples

```bash
# Create a new tooling stack
AITK_NON_INTERACTIVE=1 aitk tooling create astro

# Sync a stack into a target project
AITK_NON_INTERACTIVE=1 aitk tooling sync astro /path/to/project

# Install a snippet
AITK_NON_INTERACTIVE=1 aitk snippets install base /path/to/project

# Run a sandbox scenario non-interactively
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling
```

## Related

- `CLAUDE.md`: project behaviors and design principles
- `.claude/skills/aitk-*`: domain-scoped guidance for editing work
- `docs/index.md`: full docs directory
