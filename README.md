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

- Claude Code plugin and skills: see [claude/README.md](claude/README.md)
- Gemini CLI extension and commands: see [gemini/README.md](gemini/README.md)

## CLI

Run `aitk` from the repo root.

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

### Tooling

| Command                           | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| `aitk tooling [stack] [path]`     | Sync golden configs, seeds, deps, and .gitignore                 |
| `aitk tooling ref [stack] [path]` | Sync reference docs for a stack and its parents                  |
| `aitk tooling create`             | Create a new stack with stub manifest, reference, configs, seeds |

### Claude

| Command              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `aitk claude init`   | Seed .claude/ workflow docs and sync .gitignore         |
| `aitk claude sync`   | Sync managed role prompts, overwriting local changes    |
| `aitk claude prompt` | Generate master prompts for planning and implementation |

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
