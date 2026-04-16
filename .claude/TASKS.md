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

### Eliminate double-write in skills that persist output

`claude-feature`, `claude-review`, `claude-ux-audit`, and `claude-ui-test` all generate output twice: once in chat, then the same content to a file. This wastes tokens and makes the user wait through duplicate generation. Each skill should write the file directly and output only the path.

- [ ] Outcome: all four skills write output to file only, then print the path
- [ ] Outcome: `claude-autoship` still reads `.claude/review/review-<slug>.md` without changes (file contract unchanged)

> Test strategy: manual, invoke each skill in its sandbox and confirm output appears once (in the file) with a path reference in chat.

### Autoship should inline git-ship steps instead of invoking it

`claude-autoship` step 7 calls `toolkit:git-ship`, but git-ship has `disable-model-invocation: true` which blocks the Skill tool. Claude works around it by reimplementing the steps ad-hoc, which is fragile and incomplete (observed: no PR opened, plan file deleted prematurely). Autoship should own the ship sequence directly — docs-sync, commit by concern, branch rename, push, PR open — instead of delegating to a restricted skill.

- [ ] Outcome: autoship step 7 lists the ship sub-steps inline in SKILL.md
- [ ] Outcome: git-ship remains `disable-model-invocation: true` (no change)
- [ ] Outcome: autoship sandbox completes end-to-end including PR creation

> Test strategy: manual, run `/claude-autoship` in `claude:autoship` sandbox and confirm PR opens on `erclx/toolkit-sandbox`.
