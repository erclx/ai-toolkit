---
name: git-branch
description: Generates and validates conventional branch names. Use when naming a new branch, renaming an existing branch, or asking "what should I name this branch".
---

# Git Branch

Before generating a branch name, read:

- `standards/branch.md`: format, types, length limit, and constraints

Follow it exactly.

## Context

Run these commands in parallel to gather git context:

- `git branch --show-current 2>/dev/null || echo "NO_BRANCH"`
- `git rev-parse --verify "origin/$(git branch --show-current)" 2>/dev/null && echo "EXISTS" || echo "LOCAL_ONLY"`
- `git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`

## Guards

- If already on main or master, stop: `❌ Cannot rename a protected branch.`
- If branch name already follows conventions, stop: `✅ Branch name already follows conventions.`
- If no commits and no args provided, stop: `❌ No commits or description to derive a branch name from.`

## Response format

### Preview

- **Current:** <current_branch>
- **Suggested:** <suggested_name>
- **Length:** <count>/50
- **Status:** <LOCAL_ONLY | EXISTS on remote>
- **Analysis:** <brief explanation of type choice>

If EXISTS on remote, warn and stop:

```plaintext
⚠️ Branch exists on remote. Rename manually via GitHub UI or gh CLI to avoid breaking open PRs.
```

### Final command

Only output if LOCAL_ONLY:

```bash
git branch -m <current> <suggested>
```
