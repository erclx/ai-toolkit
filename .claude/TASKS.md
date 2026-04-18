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

### Audit sandbox scenario output UI for canonical consistency

Plan: .claude/plans/feature-sandbox-output-audit.md

- [x] Outcome: every sandbox scenario renders one frame with banner, section headers, and closing `└` on stderr
- [x] Outcome: stdout stays clean of UI characters across all scenarios
- [x] Outcome: findings report filed before any fix work begins

> Test strategy: manual, run each non-interactive scenario via `SANDBOX_SCENARIO=… aitk sandbox <cat>:<cmd>` and diff captured stdout/stderr against the canonical in `docs/agents.md`.

### Align sandbox scenario prose with prose.md

- [ ] Outcome: no em dashes in any `scripts/sandbox/**/*.sh` log line
- [ ] Outcome: option/menu lists use `:` as the name-to-description separator
- [ ] Outcome: inline em dashes in prose rewritten as commas or split sentences

> Test strategy: manual, grep for `—` under `scripts/sandbox/` returns zero matches, spot-run three representative scenarios and confirm output still reads cleanly.
