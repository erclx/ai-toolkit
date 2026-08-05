---
title: Command catalog
description: Every project-level command and every domain subcommand, plus the shape each domain exposes
---

# Command catalog

Full help: `aitk <command> --help`. Behavior notes for the install and sync verbs live in `install-and-sync.md`.

## Project-level

| Command                    | Purpose                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `aitk init [path]`         | Bootstrap a project with selected toolkit domains                                              |
| `aitk sync [path]`         | Sync all installed domains in a target project                                                 |
| `aitk sync --check`        | Report toolkit drift without writing (`--json`, `--exit-code`)                                 |
| `aitk sandbox [cat:cmd]`   | Run sandbox scenarios (interactive or routed), toolkit-only like the tree it reads             |
| `aitk sandbox reset`       | Reset sandbox to baseline                                                                      |
| `aitk sandbox clean`       | Wipe the sandbox                                                                               |
| `aitk sandbox check`       | Score a provisioned sandbox against a scenario expectation (`--json` for the verdict)          |
| `aitk sandbox coverage`    | Report which scenarios declare expectations (`--json`, `--strict`, `--skills`)                 |
| `aitk indexes regen`       | Regenerate `index.md` files from sibling frontmatter                                           |
| `aitk docs [topic]`        | Emit toolkit reference docs (`list`, or a topic by name)                                       |
| `aitk design render`       | Render `.claude/DESIGN.md` tokens to HTML and CSS                                              |
| `aitk slides render`       | Render a `.claude/SLIDES.md` source into a PowerPoint deck                                     |
| `aitk slides list`         | List the available slide layouts (`--json` for the catalog)                                    |
| `aitk feedback`            | Write toolkit feedback from stdin to `.claude/review/`, or open a GitHub issue with `--github` |
| `aitk transcripts <url>`   | Fetch a YouTube transcript with metadata frontmatter (needs `yt-dlp`)                          |
| `aitk tasks archive`       | Move a shipped task off the board, clear its ordering row, and regenerate the index            |
| `aitk tasks pull-request`  | Record a pull request number on the task a branch closes, by stem or `--plan` (`--json`)       |
| `aitk tasks outcome`       | Mark outcomes `[x]` on a task by position, repeating `--close` (`--json`)                      |
| `aitk tasks validate`      | Report board rows whose plan, task file, group, or file set does not hold (`--json`)           |
| `aitk records validate`    | Report a session record against the standard governing it, per kind (`--json`)                 |
| `aitk comments scan`       | Measure comment density by language and comment kind, with a trend recomputed from git         |
| `aitk context audit`       | Report required sections, length, depth, bullet weight, cited paths, provenance, and drift     |
| `aitk claude skills audit` | Report both skill corpora against the mechanical rules in `standards/skill.md`                 |
| `aitk capture [source]`    | Render HTML capture sources to PNG, toolkit-only and absent from an installed package          |

## Domain commands

Each domain exposes a consistent shape where applicable: `list`, `install`, `sync`, `create`.

| Domain      | Subcommands                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| `tooling`   | `list`, `sync`, `ref`, `create`, `verify`, `inject`, `prune-gitignore`      |
| `snippets`  | `list`, `install`, `sync`, `create`                                         |
| `standards` | `list`, `install`, `sync`                                                   |
| `gov`       | `list`, `install`, `sync`, `build`                                          |
| `claude`    | `init`, `sync`, `seeds list`, `skills list`, `skills audit`, `setup [dest]` |
| `wiki`      | `init`                                                                      |
| `design`    | `render`                                                                    |
| `slides`    | `render`, `list`                                                            |
| `tasks`     | `archive`, `validate`                                                       |
| `comments`  | `scan`                                                                      |
| `context`   | `audit`                                                                     |

Common patterns:

- `list --json` → machine-readable catalog on stdout.
- `install <name> <path>` → install a specific entry into a target project.
- `sync <path>` → reapply all installed entries in a target project.
- `create [name]` → scaffold a new authoring entry in this repo.
