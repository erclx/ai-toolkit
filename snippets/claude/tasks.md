Read `.claude/TASKS.md` and `.claude/TASKS-ARCHIVE.md`, then run three steps in order.

First, promote complete tasks. In "Up next", find every `###` block that has at least one checkbox and where all checkboxes are `[x]`. Move each block, including its header, bullets, and test strategy line, to the bottom of "Done". Remove it from "Up next". Skip blocks with no checkboxes.

Second, archive overflow. Count `###` blocks in "Done". If the count exceeds 10, move the oldest half (rounded down) to the bottom of `.claude/TASKS-ARCHIVE.md` and remove them from "Done".

Third, fill the placeholder. If "Up next" now has no `###` blocks with checkboxes, and the `### Nothing queued` block is not already present, insert it:

```markdown
### Nothing queued

- No tasks currently
```

Preserve all formatting and content exactly. Do not touch "Up next" blocks that still have unchecked items.
