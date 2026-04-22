# Tasks

Track what is being built and why, at the level of features and outcomes. No code-level steps or technical decisions. Those live in `ARCHITECTURE.md`. Update this doc whenever a task is started, completed, or scope changes.

When a task needs execution detail beyond this board, create a plan in `.claude/plans/` and add a `Plan:` line under the title pointing to it. On ship, delete the plan file.

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

### Publicize the toolkit repository

- [x] Outcome: top-level `README.md` rewritten as a user-facing pitch with positioning, prerequisites, and quickstart
- [x] Outcome: personal references audited and generalized so an outside clone works without edits
- [x] Outcome: an outside developer can clone the repo, install prerequisites, and run `aitk init` in a fresh project without reading the source
- [ ] Outcome: link to the toolkit from public profile surfaces (GitHub pinned, resume, portfolio)

> Test strategy: deterministic, `bun run check:install` clones the repo into tmp and asserts `aitk init` produces the expected scaffold. Manual fresh-clone walk on a second machine remains as the final human verification.

### Record a toolkit README screencast

- [ ] Outcome: a short asciinema or video recording of clone, `aitk init`, and one skill invocation embedded in the README as portfolio signal

> Test strategy: manual, play back the recording end to end and confirm the narrative matches the current README Quickstart

### Add install-path sandbox scenario

- [ ] Outcome: a sandbox scenario that exercises `bun run check:install` against a clean baseline, so silent prereq drift is caught before a new user hits it

> Test strategy: manual, run the scenario and confirm it reports any undocumented prereq the fresh clone needs
