# Toolkit

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects.

Designed for agent consumption. Every command has a non-interactive mode and a catalog view, so Claude Code skills and other agents can orchestrate the toolkit as well as humans can.

## Installation

```bash
git clone git@github.com:erclx/toolkit.git
cd toolkit
bun install
bun link
```

## Setup guides

- Claude Code plugin and skills: see [docs/claude.md](docs/claude.md)
- Gemini CLI extension and commands: see [docs/gemini.md](docs/gemini.md)

## CLI

Run `aitk` from the repo root.

### Sync

| Command            | Description                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| `aitk sync [path]` | Sync all installed domains, regenerate GOV.md if present, then commit and open a PR |

### Governance

| Command                                         | Description                                            |
| ----------------------------------------------- | ------------------------------------------------------ |
| `aitk gov install [stack] [--add rules] [path]` | Bootstrap rules for a stack into a project             |
| `aitk gov sync [path]`                          | Update existing rules in a project                     |
| `aitk gov build [path]`                         | Concatenate installed rules into .cursor/.tmp/rules.md |
| `aitk gov list [--stacks\|--rules] [--json]`    | Emit catalog of stacks and rules                       |

### Standards

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `aitk standards install [path]` | Install standards to a project |
| `aitk standards sync [path]`    | Sync standards to a project    |
| `aitk standards list [--json]`  | Emit catalog of standards      |

### Antigravity

| Command                                   | Description                              |
| ----------------------------------------- | ---------------------------------------- |
| `aitk antigravity install [group] [path]` | Install Antigravity workflows to project |
| `aitk antigravity sync [path]`            | Sync Antigravity workflows in project    |

### Snippets

| Command                                                 | Description                              |
| ------------------------------------------------------- | ---------------------------------------- |
| `aitk snippets install [category] [path]`               | Install snippets for a category          |
| `aitk snippets sync [path]`                             | Sync snippets already present in project |
| `aitk snippets create`                                  | Create a new snippet and register it     |
| `aitk snippets list [--categories\|--entries] [--json]` | Emit catalog of categories and entries   |

### Prompts

| Command                                  | Description                             |
| ---------------------------------------- | --------------------------------------- |
| `aitk prompts install [category] [path]` | Install prompts for a category          |
| `aitk prompts sync [path]`               | Sync prompts already present in project |
| `aitk prompts list [--json]`             | Emit catalog of prompts                 |

### Init

| Command                    | Description                                               |
| -------------------------- | --------------------------------------------------------- |
| `aitk init [path] [flags]` | Bootstrap a project with base tooling and toolkit domains |

Flags: `--stack <name>`, `--add <rules>`, `--snippets <cat>`, `--with standards,prompts,antigravity`, `--skip wiki`. Passing any flag skips the interactive optional-domain picker.

### Tooling

| Command                           | Description                                           |
| --------------------------------- | ----------------------------------------------------- |
| `aitk tooling [stack] [path]`     | Sync configs, seeds, deps, and .gitignore for a stack |
| `aitk tooling ref [stack] [path]` | Sync reference docs for a stack and its parents       |
| `aitk tooling create`             | Create a new stack with stub manifest and reference   |
| `aitk tooling list [--json]`      | Emit catalog of stacks with extends and dep summary   |

### Claude

| Command              | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `aitk claude init`   | Seed .claude/ project docs and CLAUDE.md into a project     |
| `aitk claude roles`  | Install role prompts (planner, implementer, reviewer)       |
| `aitk claude sync`   | Diff managed files against source and apply updates         |
| `aitk claude prompt` | Generate master prompts from installed rules (needs roles)  |
| `aitk claude gov`    | Build governance rules into .claude/GOV.md                  |
| `aitk claude setup`  | Install user-level Claude config (statusline) to ~/.claude/ |

### Wiki

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `aitk wiki init` | Scaffold wiki/ folder with stub index.md |

### Indexes

| Command                        | Description                                             |
| ------------------------------ | ------------------------------------------------------- |
| `aitk indexes regen [path...]` | Regenerate `index.md` files from sibling frontmatter    |
| `aitk indexes regen --dry-run` | Report drift without writing (exits 2 when drift found) |
| `aitk indexes regen --json`    | Emit machine-readable records on stdout                 |

### Sandbox

| Command                             | Description                                                 |
| ----------------------------------- | ----------------------------------------------------------- |
| `aitk sandbox`                      | Interactive scenario picker                                 |
| `aitk sandbox [cat:cmd]`            | Provision a sandbox scenario with interactive scenario pick |
| `aitk sandbox [cat:cmd] <scenario>` | Provision a specific scenario without prompts               |
| `aitk sandbox reset`                | Restore sandbox to baseline                                 |
| `aitk sandbox clean`                | Wipe sandbox                                                |

See [`docs/`](docs/) for full documentation.

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
