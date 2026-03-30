---
description: Rewrites stale README.md and docs/*.md sections based on changes since main
---

# Docs sync

Read these files from the project root in parallel:

- `standards/prose.md`: prose conventions for all generated text
- `standards/readme.md`: README structure, required sections, and content rules

## Context

Run these commands in parallel:

// turbo

1. Run `git diff main -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`
   // turbo
2. Run `git diff --name-only main 2>/dev/null || echo "NO_FILES"`
   // turbo
3. Run `git status --short 2>/dev/null || echo "NO_STATUS"`

## Guards

- If diff output is empty and status output is empty, stop: `❌ No changes since main. Nothing to sync.`

## Discovery

Discover docs dynamically. Do not hardcode paths:

- Glob `README.md` at project root
- Glob `docs/**/*.md`

Read each discovered file in parallel.

## Analysis

For each discovered doc, classify as one of:

- `stale`: the diff touches something the doc describes
- `unrelated`: no overlap between diff and doc content

## Action

Rewrite only the stale sections. Do not touch sections unrelated to the diff. Write the updated file immediately after the preview.

## Response format

### Preview

**Changes since main:** `<n>` files
**Docs discovered:** `<list>`

| Doc         | Status    | Action |
| ----------- | --------- | ------ |
| README.md   | stale     | update |
| docs/api.md | unrelated | skip   |

After outputting the preview, write all stale updates immediately.

### Summary

```
✅ Updated: <files written>
⏭️  Skipped: <files with no overlap>
```
