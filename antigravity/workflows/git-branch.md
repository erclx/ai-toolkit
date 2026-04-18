---
description: Generates and validates conventional branch names
---

# Git branch

Before generating a branch name, read from the project root:

- `standards/branch.md`: format, types, length limit, and constraints

Follow it exactly.

## Context

Run these commands in parallel to gather git context:

// turbo

1. Run `git branch --show-current 2>/dev/null || echo "NO_BRANCH"`
   // turbo
2. Run `git rev-parse --verify "origin/$(git branch --show-current)" 2>/dev/null && echo "EXISTS" || echo "LOCAL_ONLY"`
   // turbo
3. Run `git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`

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

Show PREVIEW first, then propose FINAL COMMAND block. Do not run until user confirms.

### Final command

Only output if LOCAL_ONLY:

```bash
git branch -m <current> <suggested>
```

## After execution

Respond with exactly one line:

`✅ Renamed: <current> → <suggested>`
