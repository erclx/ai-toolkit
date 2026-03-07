# AI Toolkit

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects.

## Installation

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
bun install
bun link
gemini extensions link ./gemini
```

## CLI

Run `aitk` from the repo root.

### Governance

| Command                           | Description                                |
| --------------------------------- | ------------------------------------------ |
| `aitk gov install [stack] [path]` | Bootstrap rules for a stack into a project |
| `aitk gov sync [path]`            | Update existing rules in a project         |

### Standards

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `aitk standards install [path]` | Install standards to a project |
| `aitk standards sync [path]`    | Sync standards to a project    |

### Tooling

| Command                           | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `aitk tooling [stack] [path]`     | Sync golden configs, seeds, deps, and .gitignore                   |
| `aitk tooling ref [stack] [path]` | Sync reference docs for a stack and its parents                    |
| `aitk tooling scaffold`           | Scaffold a new stack with stub manifest, reference, configs, seeds |

### Claude

| Command              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `aitk claude init`   | Seed .claude/ workflow docs and sync .gitignore         |
| `aitk claude sync`   | Diff managed role prompts against seed and apply        |
| `aitk claude prompt` | Generate master prompts for planning and implementation |

### Sandbox

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `aitk sandbox`           | Interactive scenario picker                  |
| `aitk sandbox [cat:cmd]` | Provision and run specific sandbox scenarios |
| `aitk sandbox reset`     | Restore sandbox to baseline                  |
| `aitk sandbox clean`     | Wipe sandbox                                 |

## Agent Commands

- Gemini CLI commands: see [gemini/README.md](gemini/README.md)
- Claude Code commands and skills: see [claude/README.md](claude/README.md)

## Architecture

Governance rules (`.cursor/rules/`) and standards (`standards/`) are the source of truth. Stack definitions (`.cursor/stacks/`) declare which rules belong to each stack. Tooling stacks live in `tooling/` and sync to target projects as concrete files.

See [docs/](docs/) for detailed documentation on governance, tooling, sandboxes, prompts, standards, and AI workflow.

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
