# Tasks

Track what is being built and why, at the level of features and outcomes. No code-level steps or technical decisions. Those live in `ARCHITECTURE.md`. Update this doc whenever a task is started, completed, or scope changes.

When a task needs execution detail beyond this board, create a plan in `.claude/plans/` and add a `Plan:` line under the title pointing to it. On ship, delete the plan file and remove the `Plan:` line from the block.

What belongs:

- Task entries describing observable behavior: short bullet per item, one outcome per line
- A test strategy line per task block: the mechanism and what is being verified, not specific file or method names
- Inline notes on blockers or dependencies, attached to the relevant Up next entry

What does not belong:

- Class names, file paths, function names, or prop names in any entry or section title
- "In progress" or "Blocked" sections. Note these inline on the Up next entry instead.
- Code-level steps or implementation details (behavioral specifics are fine)

Title form by task type:

- Feature: outcome describing what the user can now do
- Fix: problem statement describing what is wrong
- Chore: imperative describing what is being done

One section only: Up next. Completed blocks stay in Up next until archived manually. Do not move them automatically. When Up next has no real tasks, keep the `### Nothing queued` placeholder. Remove it when adding the first real task.

Task block format. Include the `Plan:` line only when a `.claude/plans/` file exists for the task:

```markdown
### Title

Plan: .claude/plans/feature-<slug>.md

- [x] Outcome: what done looks like
- [x] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Up next

### Reshape the snippets catalog

Plan: .claude/plans/feature-reshape-snippets-catalog.md

- [x] Remove `senior-mode.md` (unused in practice)
- [x] Add `decision-help.md`: surfaces the questions the user needs to answer before a sensible decision, no recommendation until answered
- [x] Move `claude/steps.md`, `claude/research-prompt.md`, `claude/prose-audit.md` up to base (no `.claude/` dependency)
- [x] Keep `claude/` strictly for snippets that reference `.claude/` paths (`figma.md`, `tasks-done.md`)

> Test strategy: manual, run `aitk snippets list` (or equivalent) and verify the catalog reflects the moves and the new snippet reads cleanly when invoked with `@decision-help`.

### Tune the claude-feature skill

- [ ] Gate code-only context reads (`GOV.md`, `DESIGN.md`, `WIREFRAMES.md`) on change type, or instruct the skill to skip them when the feature is prose/catalog/docs-only. CLAUDE.md, REQUIREMENTS.md, ARCHITECTURE.md, TASKS.md stay universal.
- [ ] Strengthen the `None identified.` escape hatch for Risks and Questions. Add a line instructing the skill to prefer empty sections over low-signal fillers for small features.

> Test strategy: manual, invoke claude-feature on a small prose-only change and confirm irrelevant files are skipped and Risks/Questions stay empty when nothing real surfaces.

### Bootstrap the index.md system in target projects

- [x] A plugin skill scans a target project, drafts frontmatter for markdown-heavy folders, and scaffolds `index.md` after user confirmation
- [x] A concept doc explains when indexes help, when to skip, and how to opt out per folder
- [x] The seeded `CLAUDE.md` carries the full index convention so newly-installed projects pick up all three rules
- [x] A `bootstrap` sandbox scenario seeds raw markdown plus a stub `CLAUDE.md` so the skill can be exercised end to end

> Test strategy: manual, run the skill against a sandbox project and verify scaffolded folders pass `aitk indexes regen --dry-run`.
