---
name: git-commit
description: Generates conventional commit messages from staged changes. Use for any git commit.
---

# Git commit

Before generating a commit message, read:

- `${CLAUDE_SKILL_DIR}/references/commit.md`: format, types, scopes, and constraints
- `.claude/standards/versioning.md` from the project root: phase label vs semver discipline

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

Follow them exactly.

## Context

Run these commands in parallel to gather git context:

- `git diff --cached --name-status 2>/dev/null || echo "NO_STAGED_CHANGES"`
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
