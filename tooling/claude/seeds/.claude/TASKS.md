# Tasks

Track what is being built and why, at the level of features and outcomes. No code-level steps or technical decisions. Those live in `ARCHITECTURE.md`. Update this doc whenever a task is started, completed, or scope changes.

Tasks chain through three artifacts:

- **TASKS bullet** (this file): outcome and test strategy. One block per task.
- **Brief** (`.claude/briefs/<slug>.md`): orchestrator handoff context for a worker session. Outcomes, constraints, files to read, sequence, open questions. Drafted by `claude-brief`. Add a `Brief:` line under the task title pointing to it.
- **Plan** (`.claude/plans/feature-<slug>.md`): worker's file-touch list, risks, and resolved questions. Drafted by `claude-feature`. Add a `Plan:` line under the task title pointing to it.

When a task needs execution detail beyond this board, the worker writes a plan. When a task needs cross-session orchestration (parallel streams, phase ordering, complex handoff), the orchestrator writes a brief first. Both files are gitignored and deleted on ship. Phase labels belong here and in briefs, not in PR titles, commit messages, or git tags. See `standards/versioning.md`.

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

Task block format. Include the `Brief:` line only when `.claude/briefs/<slug>.md` exists. Include the `Plan:` line only when `.claude/plans/feature-<slug>.md` exists.

```markdown
### Title

Brief: .claude/briefs/<slug>.md
Plan: .claude/plans/feature-<slug>.md

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Up next

### Nothing queued

- No tasks currently
