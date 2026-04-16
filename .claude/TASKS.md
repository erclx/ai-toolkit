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

### Feature: curated descriptions for every indexed folder

- [x] Outcome: every prompt, standard, doc, and wiki file carries `title` and `description` frontmatter, with `category` on docs
- [x] Outcome: generated `prompts/index.md`, `standards/index.md`, `docs/index.md`, and `wiki/index.md` show the curated title and description from frontmatter
- [x] Outcome: `aitk standards list` and the new `aitk prompts list` read the same frontmatter, so catalog output matches the index
- [x] Outcome: `bun run check` fails if any indexed file is missing required frontmatter
- [x] Outcome: authoring docs and skills describe the new frontmatter convention so new files in any indexed folder include it by default
- [x] Outcome: `standards/prose.md` owns the canonical style rule for frontmatter descriptions; domain docs link to it

> Test strategy: manual, regenerate indexes in the toolkit and confirm each entry uses the curated title and description, then install a subset into a fresh target and confirm parity

### Chore: auto-regenerate every folder that has an index.md

- [ ] Outcome: index regeneration walks the repo and rewrites every `index.md` it finds, without a hardcoded folder list
- [ ] Outcome: a new folder with an `index.md` plus frontmatter-bearing siblings picks up on the next `bun run check` with no script edit
- [ ] Outcome: folders opt out via `auto: false` in the index's own frontmatter, so curated hand-edited indexes are preserved
- [ ] Outcome: the walker skips scratch and vendored paths (`node_modules`, `.git`, `.claude/plans/`, `.claude/review/`, `dist/`, `build/`)
- [ ] Outcome: each `index.md` lists only its immediate siblings; subfolders are never traversed into the parent index

> Test strategy: manual, add a fresh folder with an `index.md` plus a file with frontmatter, run `bun run check`, and confirm regeneration; repeat with an `auto: false` index and confirm it is left alone
