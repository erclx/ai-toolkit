# Gemini extension

Gemini CLI extension and command definitions for the Toolkit.

## Structure

```plaintext
gemini/
├── commands/
│   ├── dev/
│   │   ├── apply.toml       ← apply file changes from a chat response
│   │   ├── comment.toml     ← add comments to code
│   │   └── review.toml      ← review code for bugs and quality issues
│   ├── docs/
│   │   └── sync.toml        ← sync README and docs with codebase changes
│   ├── git/
│   │   ├── branch.toml      ← rename current branch to conventional format
│   │   ├── commit.toml      ← generate conventional commit message from staged changes
│   │   ├── pr.toml          ← generate PR description and open draft
│   │   ├── stage.toml       ← group staged files for batch commits
│   │   └── split.toml       ← split mixed commits into separate branches
│   ├── release/
│   │   └── changelog.toml   ← generate changelog entry from commit history
│   └── tasks/
│       └── flush.toml       ← move completed tasks to Done and archive overflow
└── gemini-extension.json    ← extension manifest, points contextFileName to GEMINI.md
```

## Setup

```bash
gemini extensions link ./gemini
```

## Commands

Commands are deterministic scripts with zero AI tokens and zero variability. Each command is a `.toml` file organized by category and invoked as `/category:command` in Gemini CLI. See `prompts/gemini-cli.md` for authoring conventions.

| Command              | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `/git:commit`        | Generate a conventional commit message from staged changes |
| `/git:branch`        | Rename current branch to match conventional format         |
| `/git:pr`            | Generate a PR description and open a draft                 |
| `/git:stage`         | Group staged files for batch commits                       |
| `/git:split`         | Split mixed commits into separate branches                 |
| `/dev:apply`         | Apply file changes from a chat response                    |
| `/dev:comment`       | Add comments to source code                                |
| `/dev:review`        | Review code from a pasted response or branch diff vs main  |
| `/docs:sync`         | Sync README and docs with codebase changes                 |
| `/release:changelog` | Generate a changelog entry from commit history             |
| `/tasks:flush`       | Move completed tasks to Done and archive overflow          |

## Adding a command

1. Create `.toml` in `gemini/commands/<category>/`
2. Create corresponding `scripts/sandbox/<category>/<cmd>.sh`
3. Add the command to the commands table above

To add a new category, create the folder in both `gemini/commands/` and `scripts/sandbox/`, then add the category and command to this file.
