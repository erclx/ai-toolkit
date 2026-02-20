# AI Toolkit

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects. Provides deterministic sync commands and AI agent commands for Gemini CLI.

## Installation

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
bun install
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

### Sandbox

| Command      | Description                                      |
| ------------ | ------------------------------------------------ |
| `gdev`       | Interactive sandbox picker for testing scenarios |
| `gdev reset` | Restore sandbox to baseline                      |
| `gdev clean` | Wipe sandbox                                     |

## Gemini Commands

| Command                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `/git:commit`             | Generate a conventional commit message from staged changes |
| `/git:pr`                 | Generate a PR description and open a draft                 |
| `/dev:setup [ref]`        | Audit project tooling drift against a reference file       |
| `/tooling:review [stack]` | Sync reference docs with current config state              |
| `/release:changelog`      | Generate a changelog entry from commit history             |
| `/docs:readme`            | Sync README with codebase changes from main branch         |

## Architecture

Governance rules (`.cursor/rules/`) and standards (`standards/`) are the source of truth. `scripts/build-gov.sh` compiles them into Gemini command artifacts under `gemini/commands/gov/`. Tooling stacks live in `tooling/` and are synced directly as concrete files.

See [GOVERNANCE.md](docs/GOVERNANCE.md), [TOOLING.md](docs/TOOLING.md), and [SANDBOX.md](docs/SANDBOX.md) for detailed documentation.

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
