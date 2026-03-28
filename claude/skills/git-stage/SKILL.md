---
name: git-stage
description: Groups staged files by concern and generates one conventional commit per group. Use when committing mixed changes, asking "how should I split these commits", or wanting to batch-commit staged files by concern.
---

# Git stage

Read these files from the project root in parallel:

- `standards/commit.md`: format, types, scopes, and constraints
- `standards/prose.md`: prose conventions for all generated text

## Context

Run these commands in parallel to gather git context:

- `git diff --cached --name-status 2>/dev/null || echo "NO_STAGED_FILES"`
- `git diff --cached -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

## Guards

- If staged files output is `NO_STAGED_FILES`, stop and output:
  `❌ No staged files. Stage files first with git add before committing.`

## Grouping rules

- Analyze the diff to understand what each file changes and why.
- Group files by shared concern. A group is a single commit.
- Files belong together when they implement or modify the same logical unit.
- A file that clearly stands alone is its own group.
- Order commits by dependency: commit dependencies before the files that import them.
- Prefix the full command sequence with `git restore --staged .` to unstage everything, then stage and commit each group in order.
- For `D` status files, use `git rm <file>`. For `A` or `M` files, use `git add <file>`.

## Response format

### Preview

**Staged files:** <total count>
**Proposed commits:** <group count>

| #   | Commit                       | Files       | Count |
| --- | ---------------------------- | ----------- | ----- |
| 1   | `<type>(<scope>): <subject>` | <filenames> | <n>   |
| 2   | `<type>(<scope>): <subject>` | <filenames> | <n>   |

**All <total> files accounted for.**

Count characters in each `<type>(<scope>): <subject>` line. Shorten any subject that exceeds 72 characters and update the table.

After outputting the preview, execute the final command immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Final command

```bash
git restore --staged .
# Commit 1: <subject>
git add <file1> <file2> && git commit -m "<type>(<scope>): <subject>"
# Commit 2: <subject>
git rm <deleted1> && git add <file3> && git commit -m "<type>(<scope>): <subject>"
```

## After execution

Respond with exactly one line:

`✅ Committed: <n> commits`

Do not add any other text.
