Read `.claude/TASKS.md` and `.claude/TASKS-ARCHIVE.md`, then run two steps in order.

First, promote complete tasks. In "Up next", find every `###` block where all checkboxes are `[x]`. Move each block, including its header, bullets, and test strategy line, to the bottom of "Done". Remove it from "Up next".

Second, archive overflow. Count `###` blocks in "Done". If the count exceeds 10, move the oldest half (rounded down) to the bottom of `.claude/TASKS-ARCHIVE.md` and remove them from "Done".

Preserve all formatting and content exactly. Do not touch "Up next" blocks that still have unchecked items.
