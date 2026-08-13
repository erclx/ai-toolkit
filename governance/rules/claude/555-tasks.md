---
description: Route .claude/tasks/ edits to the tasks standard for filenames, frontmatter, and task file format
paths:
  - '.claude/tasks/**'
---

# Tasks standards

## What a task carries

- Name where the task came from, through a `Plan:`, `Groundwork:`, `Intake:`, or `Issue:` line under the title.
- Size the outcomes so one pull request closes all of them. Split the task before handing it off.
- Use `## Outcomes` and `## Findings` and add no third heading. Note status inline on an outcome.
- Keep class names, file paths, function names, and prop names out of every entry and title.
- Never delete a task file. A shipped task moves to the archive under its own name.

## Authority

- Follow `.claude/standards/tasks.md` for filenames, frontmatter, what belongs, and the task file format. It is the single source.
- Never hand-edit `.claude/tasks/index.md`. A hook regenerates it from sibling frontmatter.
