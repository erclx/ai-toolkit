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

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Up next

### Feature: generated domain indexes on install and sync

- [x] Outcome: `aitk prompts install` writes a `prompts/index.md` in the target that contains only entries for installed files
- [x] Outcome: `aitk prompts sync` regenerates the target's `prompts/index.md` based on what is present
- [x] Outcome: `aitk standards install` and `aitk standards sync` apply the same pattern to `standards/index.md`
- [x] Outcome: docs describe the new generated file category alongside configs, seeds, and references

> Test strategy: manual, install a subset of prompts in a fresh target and confirm the generated index lists only installed entries, then add and remove files to verify the index tracks each change

### Feature: curated descriptions for prompts and standards catalogs

Plan: `.claude/plans/feature-frontmatter-descriptions.md`

- [ ] Outcome: every prompt and standard file carries a frontmatter `description` field with a one-line summary
- [ ] Outcome: generated `prompts/index.md` and `standards/index.md` show the curated description instead of the file's H1 title
- [ ] Outcome: `aitk standards list` (and the future `aitk prompts list`) read the same description field, so catalog output matches the index
- [ ] Outcome: authoring docs and skills describe the new frontmatter convention so new prompts and standards include it by default

> Test strategy: manual, regenerate indexes in the toolkit and confirm each entry uses the curated description, then install a subset into a fresh target and confirm the target index uses the same curated descriptions
