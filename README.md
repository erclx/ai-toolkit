# Toolkit

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects.

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

| Command                           | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `aitk gov install [stack] [path]` | Bootstrap rules for a stack into a project             |
| `aitk gov sync [path]`            | Update existing rules in a project                     |
| `aitk gov build [path]`           | Concatenate installed rules into .cursor/.tmp/rules.md |

### Standards

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `aitk standards install [path]` | Install standards to a project |
| `aitk standards sync [path]`    | Sync standards to a project    |

### Antigravity

| Command                                   | Description                              |
| ----------------------------------------- | ---------------------------------------- |
| `aitk antigravity install [group] [path]` | Install Antigravity workflows to project |
| `aitk antigravity sync [path]`            | Sync Antigravity workflows in project    |

### Snippets

| Command                                   | Description                              |
| ----------------------------------------- | ---------------------------------------- |
| `aitk snippets install [category] [path]` | Install snippets for a category          |
| `aitk snippets sync [path]`               | Sync snippets already present in project |
| `aitk snippets create`                    | Create a new snippet and register it     |

### Prompts

| Command                                  | Description                             |
| ---------------------------------------- | --------------------------------------- |
| `aitk prompts install [category] [path]` | Install prompts for a category          |
| `aitk prompts sync [path]`               | Sync prompts already present in project |

### Init

| Command            | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `aitk init [path]` | Bootstrap a project with base tooling and toolkit domains |

### Tooling

| Command                           | Description                                           |
| --------------------------------- | ----------------------------------------------------- |
| `aitk tooling [stack] [path]`     | Sync configs, seeds, deps, and .gitignore for a stack |
| `aitk tooling ref [stack] [path]` | Sync reference docs for a stack and its parents       |
| `aitk tooling create`             | Create a new stack with stub manifest and reference   |

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

### Sandbox

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `aitk sandbox`           | Interactive scenario picker                  |
| `aitk sandbox [cat:cmd]` | Provision and run specific sandbox scenarios |
| `aitk sandbox reset`     | Restore sandbox to baseline                  |
| `aitk sandbox clean`     | Wipe sandbox                                 |

See [`docs/`](docs/) for full documentation.

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
