# AI Toolkit

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects. Provides deterministic sync commands and AI agent commands for Gemini CLI.

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

| Command                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `gdev gov build`       | Compile rules and standards into `.toml` artifacts |
| `gdev gov sync [path]` | Push rules and standards to a target project       |

### Tooling

| Command                           | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `gdev tooling [stack] [path]`     | Sync golden configs, seeds, deps, and references |
| `gdev tooling ref [stack] [path]` | Drop reference docs only                         |

### Prompts

| Command       | Description                                          |
| ------------- | ---------------------------------------------------- |
| `gdev prompt` | Generate a master prompt from installed cursor rules |

### Sandbox

| Command      | Description                                      |
| ------------ | ------------------------------------------------ |
| `gdev`       | Interactive sandbox picker for testing scenarios |
| `gdev reset` | Restore sandbox to baseline                      |
| `gdev clean` | Wipe sandbox                                     |

## Gemini Commands

### Git

| Command       | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `/git:commit` | Generate a conventional commit message from staged changes |
| `/git:branch` | Rename current branch to match conventional format         |
| `/git:pr`     | Generate a PR description and open a draft                 |

### Governance

| Command          | Description                             |
| ---------------- | --------------------------------------- |
| `/gov:rules`     | Install governance rules into a project |
| `/gov:standards` | Install project reference standards     |

### Development

| Command            | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `/dev:setup [ref]` | Audit project tooling drift against a reference file |
| `/dev:apply`       | Apply file changes from a chat response              |

### Tooling

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `/tooling:review [stack]` | Sync reference docs with current config state |

### Docs and Release

| Command              | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `/docs:sync`         | Sync README and docs with codebase changes from main branch |
| `/release:changelog` | Generate a changelog entry from commit history              |

## Architecture

Governance rules (`.cursor/rules/`) and standards (`standards/`) are the source of truth. `scripts/build-gov.sh` compiles them into Gemini command artifacts under `gemini/commands/gov/`. Tooling stacks live in `tooling/` and sync directly as concrete files.

See [GOVERNANCE.md](docs/GOVERNANCE.md), [TOOLING.md](docs/TOOLING.md), [SANDBOX.md](docs/SANDBOX.md), and [PROMPTS.md](docs/PROMPTS.md) for detailed documentation.

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
