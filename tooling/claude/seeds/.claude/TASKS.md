# Tasks

Track what is being built and why, at the level of features and outcomes. Not implementation steps or technical decisions. Those live in `ARCHITECTURE.md`. Update this doc whenever a task is started, completed, or scope changes.

What belongs:

- Task entries describing what and why: short bullet per item, one outcome per line
- A test strategy line per task: the type of test and a brief justification, not specific file or method names
- Inline notes on blockers or dependencies, attached to the relevant Up next entry

What does not belong:

- Class names, file paths, function names, or prop names in any entry or section title
- "In progress" or "Blocked" sections. Note these inline on the Up next entry instead.
- How something will be implemented

Two sections only: Up next and Done. When completing a task, mark it `[x]` in place within "Up next" and do not move it. Done is capped at 10 entries. Oldest entries overflow to `.claude/TASKS-ARCHIVE.md`. When Up next has no real tasks, keep the `### Nothing queued` placeholder. Remove it when adding the first real task.

## Up next

### Nothing queued

- No tasks currently

## Done

### Feature N: description

- [x] Todo item: what done looks like
- [x] Todo item: what done looks like

> Test strategy: justification
