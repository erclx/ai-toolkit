---
name: docs-sync
description: Rewrites stale README.md and docs/*.md sections based on changes since main. Flags CLAUDE.md and GEMINI.md with suggestions. Use before staging, or when asked to "sync docs" or "update the docs". Do NOT use for changelog updates.
---

# Docs sync

Before updating any docs, read:

- `standards/prose.md`: prose conventions for all generated text
- `standards/readme.md`: README structure, required sections, and content rules

Follow them exactly.

## Context

Run these commands in parallel:

- `git diff main..HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`
- `git diff --name-only main..HEAD 2>/dev/null || echo "NO_FILES"`
- `git status --short 2>/dev/null || echo "NO_STATUS"`

## Guards

- If `git diff main..HEAD` output is empty and `git status --short` output is empty, stop: `❌ No changes since main. Nothing to sync.`

## Discovery

Discover docs dynamically. Do not hardcode paths:

- Glob `README.md` at project root
- Glob `docs/**/*.md`
- Glob `CLAUDE.md` at project root
- Glob `GEMINI.md` at project root

Read each discovered file.

## Analysis

For each discovered doc, classify as one of:

- `stale`: the diff touches something the doc describes (commands, features, API, setup, flags, behavior)
- `unrelated`: no overlap between diff and doc content
- `behavioral`: `CLAUDE.md` or `GEMINI.md`, always handled with suggestions, never auto-written

## Action

### Stale README.md and docs/\*.md

Rewrite only the stale sections. Do not touch sections unrelated to the diff. Write the updated file immediately after the preview. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Stale CLAUDE.md and GEMINI.md

Do not auto-write. Output specific suggested edits as a quoted diff block for the user to apply manually.

### Unrelated docs

Skip. Note in summary.

## Response format

### Preview

**Changes since main:** `<n>` files
**Docs discovered:** `<list>`

| Doc         | Status    | Action     |
| ----------- | --------- | ---------- |
| README.md   | stale     | update     |
| docs/api.md | unrelated | skip       |
| CLAUDE.md   | stale     | suggestion |

After outputting the preview, write all stale README.md and docs/ updates immediately.

### Suggestions for behavioral docs

For each stale CLAUDE.md or GEMINI.md:

**`CLAUDE.md` suggested edit:**

```diff
- old line
+ new line
```

### Summary

```
✅ Updated:     <files written>
⚠️  Suggestions: <files flagged>
⏭️  Skipped:     <files with no overlap>
```
