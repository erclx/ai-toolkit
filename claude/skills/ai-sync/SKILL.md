---
name: ai-sync
description: Reviews CLAUDE.md and GEMINI.md against recent changes and outputs specific suggested edits as diff blocks. Use when structural changes affect AI behavior rules, key paths, or workflow conventions. Do NOT auto-write. Suggestions only.
---

# AI sync

## Context

Run these commands in parallel:

- `git diff main..HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`
- `git diff --name-status main..HEAD 2>/dev/null || echo "NO_FILES"`
- `git status --short 2>/dev/null || echo "NO_STATUS"`

## Guards

- If both `git diff main..HEAD` and `git status --short` are empty, stop: `❌ No changes. Nothing to review.`

## Discovery

Read these in parallel, skipping any that do not exist:

- `CLAUDE.md`
- `GEMINI.md`

## Analysis

For each file found, determine whether the diff touches something it describes: key paths, commands, workflow conventions, skill names, or behavior rules. If there is no overlap, classify as unrelated and skip.

## Output

For each stale file, output specific suggested edits as a diff block. Do not rewrite the whole file. Target only the sections affected by the diff.

**`CLAUDE.md` suggested edit:**

```diff
- old line
+ new line
```

If no changes are needed, write: `✅ CLAUDE.md is up to date.`

Repeat for `GEMINI.md`.

Stop here. Apply suggestions manually.
