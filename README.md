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

Run `gdev` from the repo root.

### Governance

| Command                           | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `gdev gov install [stack] [path]` | Bootstrap rules for a stack into a project       |
| `gdev gov sync [path]`            | Update existing rules and standards in a project |

### Tooling

| Command                           | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `gdev tooling [stack] [path]`     | Sync golden configs, seeds, deps, and .gitignore                   |
| `gdev tooling ref [stack] [path]` | Drop reference docs only                                           |
| `gdev tooling scaffold`           | Scaffold a new stack with stub manifest, reference, configs, seeds |

### Prompts

| Command       | Description                                        |
| ------------- | -------------------------------------------------- |
| `gdev prompt` | Generate a chat master prompt from installed rules |

### Claude

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `gdev claude init`   | Seed .claude/ workflow docs into a project      |
| `gdev claude update` | Diff SESSION.md against seed and offer to apply |

### Sandbox

| Command      | Description                                      |
| ------------ | ------------------------------------------------ |
| `gdev`       | Interactive sandbox picker for testing scenarios |
| `gdev reset` | Restore sandbox to baseline                      |
| `gdev clean` | Wipe sandbox                                     |

## Agent Commands

- Gemini CLI commands: see [gemini/README.md](gemini/README.md)
- Claude Code commands and skills: see [claude/README.md](claude/README.md)

## Architecture

Governance rules (`.cursor/rules/`) and standards (`standards/`) are the source of truth. Stack definitions (`.cursor/stacks/`) declare which rules belong to each stack. Tooling stacks live in `tooling/` and sync to target projects as concrete files.

See [docs/](docs/) for detailed documentation on governance, tooling, sandboxes, prompts, and workflow.

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
