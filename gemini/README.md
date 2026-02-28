# Gemini

Gemini CLI extension and command definitions for the AI Toolkit.

## Structure

```
gemini/
├── commands/
│   ├── dev/
│   │   ├── apply.toml       ← apply file changes from a chat response
│   │   └── setup.toml       ← audit project tooling drift against a reference file
│   ├── docs/
│   │   └── sync.toml        ← sync README and docs with codebase changes
│   ├── git/
│   │   ├── branch.toml      ← rename current branch to conventional format
│   │   ├── commit.toml      ← generate conventional commit message from staged changes
│   │   └── pr.toml          ← generate PR description and open draft
│   ├── gov/
│   │   └── rules.toml       ← compiled governance rules artifact (do not edit directly)
│   ├── release/
│   │   └── changelog.toml   ← generate changelog entry from commit history
│   └── tooling/
│       └── review.toml      ← sync reference docs with current config state
└── gemini-extension.json    ← extension manifest, points contextFileName to GEMINI.md
```

## Commands

| Command                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `/git:commit`             | Generate a conventional commit message from staged changes |
| `/git:branch`             | Rename current branch to match conventional format         |
| `/git:pr`                 | Generate a PR description and open a draft                 |
| `/dev:setup [ref]`        | Audit project tooling drift against a reference file       |
| `/dev:apply`              | Apply file changes from a chat response                    |
| `/gov:rules`              | Install governance rules into a project                    |
| `/tooling:review [stack]` | Sync reference docs with current config state              |
| `/docs:sync`              | Sync README and docs with codebase changes                 |
| `/release:changelog`      | Generate a changelog entry from commit history             |

## Setup

```bash
gemini extensions link ./gemini
```
