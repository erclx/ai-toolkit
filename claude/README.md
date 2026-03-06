# Claude

Claude Code plugin and skills for the AI Toolkit.

## Structure

```
claude/
├── skills/              ← Claude Code skills (auto-discovered by plugin)
│   ├── git-commit/      ← generate conventional commit message from staged changes
│   ├── git-pr/          ← generate PR description and open pull request
│   └── git-branch/      ← rename current branch to conventional format
└── .claude-plugin/
    └── plugin.json      ← plugin manifest
```

## Skills

| Skill        | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `git-commit` | Generate a conventional commit message from staged changes |
| `git-branch` | Rename current branch to match conventional format         |
| `git-pr`     | Generate a PR description and open a pull request          |

## Setup

```bash
claude --plugin-dir /path/to/ai-toolkit/claude
```

Add to your shell config to load automatically:

```bash
alias claude='claude --plugin-dir /path/to/ai-toolkit/claude'
```
