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

One section only: Up next. Completed blocks stay in Up next until archived manually. Do not move them automatically. When Up next has no real tasks, keep the `### Nothing queued` placeholder. Remove it when adding the first real task.

Task block format:

```markdown
### Title

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Up next

### Feature: generated domain indexes on install and sync

Plan: `.claude/plans/feature-generated-indexes.md`

- [ ] Outcome: `aitk prompts install` writes a `prompts/index.md` in the target that contains only entries for installed files
- [ ] Outcome: `aitk prompts sync` regenerates the target's `prompts/index.md` based on what is present
- [ ] Outcome: `aitk standards install` and `aitk standards sync` apply the same pattern to `standards/index.md`
- [ ] Outcome: docs describe the new generated file category alongside configs, seeds, and references

> Test strategy: manual, install a subset of prompts in a fresh target and confirm the generated index lists only installed entries, then add and remove files to verify the index tracks each change

### Chore: document the plan-line convention in the tasks preamble

- [ ] Outcome: the task block format example in the preamble shows an optional plan line under the title
- [ ] Outcome: the preamble states the ship lifecycle: delete the plan file and remove the plan line from the block
- [ ] Outcome: the seed preamble installed into target projects matches the toolkit's own preamble

> Test strategy: manual, open both tasks boards, confirm the format example shows the plan line and the lifecycle prose matches
