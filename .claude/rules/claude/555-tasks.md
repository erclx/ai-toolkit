---
description: Route .claude/tasks/ edits to the tasks standard for filenames, frontmatter, and task file format
paths:
  - '.claude/tasks/**'
---

# Tasks standards

## Authority

- Follow the tasks standard for filenames, frontmatter, what belongs, and the task file format. It is the single source. Read it with `aitk standards tasks`.
- Never hand-edit `.claude/tasks/index.md`. A hook regenerates it from sibling frontmatter.
