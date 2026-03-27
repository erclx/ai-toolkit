---
name: git-commit
description: Generates conventional commit messages from staged changes. Use when writing a commit message, checking commit format, or asking "what should my commit say".
---

# Git Commit

Before generating a commit message, read from the project root:

- `standards/commit.md`: format, types, scopes, and constraints

Follow it exactly.

## Context

Run these commands in parallel to gather git context:

- `git diff --cached --name-status 2>/dev/null || echo "NO_STAGED_CHANGES"`
- `git diff --cached --stat 2>/dev/null || echo "NO_STAT"`
- `git diff --cached -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

## Guards

- If staged files output is `NO_STAGED_CHANGES`, stop and output:
  `❌ No staged changes. Stage files first with git add before committing.`

## Response format

### Preview

- **Files:** <if ≤3 list all, if >3 show first 3 + "+N more">
- **Message:** `<type>(<scope>): <subject>`
- **Length:** <count>/72

After outputting the preview, execute the final command immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Final command

```bash
git commit -m "<type>(<scope>): <subject>"
```

## After execution

Respond with exactly one line:

`✅ Committed: <type>(<scope>): <subject>`

Do not add any other text.
