Read `.claude/TASKS.md` and `.claude/TASKS-ARCHIVE.md`.

Find every `###` block in "Up next" that has at least one checkbox and where all checkboxes are `[x]`:

1. Append each completed block to the bottom of `.claude/TASKS-ARCHIVE.md`, in the order they appear in "Up next".
2. Remove each completed block from "Up next".
3. Sync the placeholder. If "Up next" still has at least one `###` block with checkboxes (checked or unchecked), remove `### Nothing queued` if present. If "Up next" has no `###` blocks with checkboxes, insert `### Nothing queued` if not already present:

```markdown
### Nothing queued

- No tasks currently
```

Skip blocks with no checkboxes. Preserve all formatting and content exactly.
