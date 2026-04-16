Read `.claude/TASKS.md`.

Find every `###` block in "Up next" that has at least one checkbox and where all checkboxes are `[x]`. Process each from top to bottom:

1. If the block has a `Plan:` line directly under the title (optionally followed by a blank line), handle plan cleanup:
   - Parse the path after `Plan: `.
   - If the path is inside `.claude/plans/`, delete that file if it exists. If the file is missing, skip silently.
   - If the path is outside `.claude/plans/`, warn and skip deletion.
2. Remove the completed block from "Up next".

Sync the placeholder. If "Up next" still has at least one `###` block with checkboxes (checked or unchecked), remove `### Nothing queued` if present. If "Up next" has no `###` blocks with checkboxes, insert `### Nothing queued` if not already present:

```markdown
### Nothing queued

- No tasks currently
```

Skip blocks with no checkboxes. Preserve all other formatting and content exactly.
