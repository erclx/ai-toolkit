---
description: Generates conventional commit messages from staged changes
---

# Git commit

Before generating a commit message, read from the project root:

- `standards/commit.md`: format, types, scopes, and constraints

Follow it exactly.

## Context

Run these commands in parallel to gather git context:

// turbo

1. Run `git diff --cached --name-status 2>/dev/null || echo "NO_STAGED_CHANGES"`
   // turbo
2. Run `git diff --cached -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

## Guards

- If staged files output is `NO_STAGED_CHANGES`, stop and output:
  `❌ No staged changes. Stage files first with git add before committing.`

## Response format

### Preview

- **Files:** <if ≤3 list all, if >3 show first 3 + "+N more">
- **Message:** `<type>(<scope>): <subject>`
- **Length:** <count>/72

Show PREVIEW first, then propose FINAL COMMAND block. Do not run until user confirms.

### Final command

```bash
git commit -m "<type>(<scope>): <subject>"
```

## After execution

Respond with exactly one line:

`✅ Committed: <type>(<scope>): <subject>`
