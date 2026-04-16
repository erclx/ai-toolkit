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

### Feature: curated descriptions for prompts and standards catalogs

Plan: `.claude/plans/feature-frontmatter-descriptions.md`

- [ ] Outcome: every prompt and standard file carries a frontmatter `description` field with a one-line summary
- [ ] Outcome: generated `prompts/index.md` and `standards/index.md` show the curated description instead of the file's H1 title
- [ ] Outcome: `aitk standards list` (and the future `aitk prompts list`) read the same description field, so catalog output matches the index
- [ ] Outcome: authoring docs and skills describe the new frontmatter convention so new prompts and standards include it by default

> Test strategy: manual, regenerate indexes in the toolkit and confirm each entry uses the curated description, then install a subset into a fresh target and confirm the target index uses the same curated descriptions

### Chore: align toolkit's `.claude/` docs with seed preamble style

- [ ] Outcome: `.claude/ARCHITECTURE.md` opens with the "What belongs / What does not belong" block matching the seed in `tooling/claude/seeds/.claude/ARCHITECTURE.md`
- [ ] Outcome: any other toolkit `.claude/` doc missing its seed preamble (DESIGN, REQUIREMENTS, WIREFRAMES) gains one
- [ ] Outcome: existing content is preserved below the preamble, no substantive edits to the sections that follow

> Test strategy: manual, diff each toolkit `.claude/*.md` against the matching seed preamble and confirm the preamble sections align

### Chore: emit preamble header from claude gov generator

- [ ] Outcome: `aitk claude gov` output begins with a regenerate pointer line matching the seed in `tooling/claude/seeds/.claude/GOV.md`
- [ ] Outcome: the toolkit's own `.claude/GOV.md` carries the preamble after a regen
- [ ] Outcome: the preamble in the seed matches what the generator emits, so target projects see the same header

> Test strategy: manual, regenerate `.claude/GOV.md` via `aitk claude gov` and confirm the preamble is the first line, then regenerate in a fresh sandbox target and confirm parity

### Chore: clarify content ownership between CLAUDE.md, ARCHITECTURE.md, and docs

- [ ] Outcome: `CLAUDE.md` names which file owns design principles, implementation patterns, narrative, and CLI surface, with no overlap in coverage
- [ ] Outcome: the cross-domain file category vocabulary (configs, seeds, references, generated files) has a single canonical home, with pointers from the other surfaces
- [ ] Outcome: no concept is described in two places with two different framings, including the "Generated files" section duplicated between `.claude/ARCHITECTURE.md` and `docs/tooling.md`

> Test strategy: manual, open each affected doc in turn and confirm each concept lives in exactly one surface with pointers elsewhere
