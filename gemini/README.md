# Gemini

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
│   │   └── pr.toml          ← generate PR description and open draft
│   └── release/
│       └── changelog.toml   ← generate changelog entry from commit history
└── gemini-extension.json    ← extension manifest, points contextFileName to GEMINI.md
```

## Commands

| Command              | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `/git:commit`        | Generate a conventional commit message from staged changes |
| `/git:branch`        | Rename current branch to match conventional format         |
| `/git:pr`            | Generate a PR description and open a draft                 |
| `/dev:apply`         | Apply file changes from a chat response                    |
| `/dev:comment`       | Add comments to source code                                |
| `/dev:review`        | Review code for bugs and quality issues                    |
| `/docs:sync`         | Sync README and docs with codebase changes                 |
| `/release:changelog` | Generate a changelog entry from commit history             |

## Setup

```bash
gemini extensions link ./gemini
```
