# AI Toolkit

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects. Run `gdev` for interactive sandbox scenarios, `gdev gov` for governance, and `gdev tooling` for config sync.

## Architecture

Governance rules (`.cursor/rules/`) and standards (`standards/`) are the source of truth. `scripts/build-gov.sh` compiles them into Gemini command artifacts under `gemini/commands/gov/`. Tooling stacks in `tooling/` sync directly as concrete files, no compilation step.

See `docs/GOVERNANCE.md`, `docs/TOOLING.md`, `docs/SANDBOX.md`, and `docs/PROMPTS.md` for full documentation.

## Commands

### gdev CLI

| Command                           | Description                                                |
| --------------------------------- | ---------------------------------------------------------- |
| `gdev gov build`                  | Compile rules and standards into `.toml` artifacts, commit |
| `gdev gov sync [path]`            | Push rules and standards to a target project               |
| `gdev tooling [stack] [path]`     | Sync golden configs, seeds, deps, and references           |
| `gdev tooling ref [stack] [path]` | Drop reference docs only                                   |
| `gdev prompt`                     | Generate a master prompt from installed cursor rules       |
| `gdev`                            | Sandbox picker                                             |
| `gdev reset`                      | Restore sandbox to baseline                                |

### Gemini Commands

| Command                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `/git:commit`             | Generate a conventional commit message from staged changes |
| `/git:branch`             | Rename current branch to match conventional format         |
| `/git:pr`                 | Generate a PR description and open a draft                 |
| `/gov:rules`              | Install governance rules into a project                    |
| `/gov:standards`          | Install project reference standards                        |
| `/dev:setup [ref]`        | Audit project tooling drift against a reference file       |
| `/dev:apply`              | Apply file changes from a chat response                    |
| `/tooling:review [stack]` | Sync reference docs with current config state              |
| `/docs:readme`            | Sync README with codebase changes                          |
| `/release:changelog`      | Generate a changelog entry from commit history             |

## Conventions

- Commits follow conventional format: `<type>(<scope>): <subject>`
- Commit golden config changes with `--no-verify` because lint-staged runs on template files, not project source
- Tooling stacks resolve via `extends` chain in `manifest.toml`, base applies first, derived stack overlays
- Sandbox scenarios provision into `.sandbox/`, always run `gdev` from the repo root
- Never edit `gemini/commands/gov/rules.toml` or `standards.toml` directly, they are overwritten on every build
