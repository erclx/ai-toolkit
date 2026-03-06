---
name: git-commit
description: Generates conventional commit messages from staged changes. Use when writing a commit message, checking commit format, or asking "what should my commit say".
---

# Git Commit

Before generating a commit message, read:

- `standards/commit.md` — format, types, scopes, and constraints

Follow it exactly.

## Guards

- Check staged files first. If nothing is staged, stop and output:
  `❌ No staged changes. Stage files first with git add before committing.`

## Response Format

### Preview

- **Files:** <if ≤3 list all, if >3 show first 3 + "+N more">
- **Message:** `<type>(<scope>): <subject>`
- **Length:** <count>/72

### Final command

```bash
git commit -m "<type>(<scope>): <subject>"
```
