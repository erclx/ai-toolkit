# Tasks

Track what is being built and why, at the level of features and outcomes. No code-level steps or technical decisions. Those live in `ARCHITECTURE.md`. Update this doc whenever a task is started, completed, or scope changes.

When a task needs execution detail beyond this board, link to a plan in `.claude/plans/` from the task block's intro paragraph. Delete the plan when the task ships.

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

One section only: Up next. Completed task blocks move to `.claude/TASKS-ARCHIVE.md`. When Up next has no real tasks, keep the `### Nothing queued` placeholder. Remove it when adding the first real task.

Task block format:

```markdown
### Title

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Up next

### Catalog emitters for other domains

Unlocks the detect-pick-execute skill pattern (proven by `gov-install`) for snippets, tooling, and standards. Each emitter is a thin `list.sh` mirroring `scripts/gov/list.sh` with the domain's own catalog files.

- [ ] `aitk snippets list` emits available snippet categories and entries with `--json` support
- [ ] `aitk tooling list` emits available stacks with extends chain and dep summary, with `--json` support
- [ ] `aitk standards list` emits available standards with descriptions and `--json` support

> Test strategy: manual, run each with and without `--json`, parse JSON output via bun and confirm stacks and entries match source files.

### Init-project skill for one-shot toolkit setup

Orchestrates the onboarding chain so a freshly scaffolded project is toolkit-ready in a single skill invocation. Pairs with `gov-install` which handles the governance leg. Skill detects package manager and tech, then chains the toolkit installers with sensible defaults.

- [ ] A single skill invocation in a new project runs init, governance install, standards install, snippets install, and claude init
- [ ] Skill detects project type from root files and picks matching stacks and categories from each domain's catalog
- [ ] Skill surfaces each step and its resolved arguments in a preview before executing
- [ ] Skill handles gaps (no matching rule or stack) by deferring to the relevant author skill instead of guessing

> Test strategy: manual, run the skill in a sandbox project with known fixtures (Astro, React, Python) and verify the resolved chain for each.
