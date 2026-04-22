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

Plan: .claude/plans/chore-publicize-repository.md

- [ ] Outcome: top-level `README.md` rewritten as a user-facing pitch with positioning, prerequisites, and quickstart
- [ ] Outcome: personal references audited and generalized so an outside clone works without edits
- [ ] Outcome: an outside developer can clone the repo, install prerequisites, and run `aitk init` in a fresh project without reading the source
- [ ] Outcome: link to the toolkit from public profile surfaces (GitHub pinned, resume, portfolio)

> Test strategy: manual, clone the repo into a fresh path on a machine with only prerequisites installed, follow the README as written, confirm `aitk init` produces a working target project without undocumented steps

### Chrome delegation feasibility spike

- [ ] Outcome: test whether Claude Code in Chrome can programmatically navigate + screenshot a URL
- [ ] Outcome: if viable, land a snippet at `snippets/web-research.md` that drives a structured walk; if not, close this task

> Test strategy: manual, invoke CC-in-Chrome against one URL, observe whether navigation and screenshot capture work, decide

### PR follow-up snippet

- [x] Outcome: new `snippets/git/followup.md` that commits current changes per `standards/commit.md` and pushes to the tracking branch
- [x] Outcome: invoked via `@snippets/git/followup` after spotting self-review edits on an open PR

> Test strategy: manual, open a PR, make a small edit, run the snippet, confirm one clean commit lands on the remote branch

### Skill sandbox alignment check

Plan: .claude/plans/feature-skill-sandbox-check.md

- [ ] Outcome: manual invocation reports whether each changed plugin skill has a matching sandbox scenario update in the branch, flagging unchanged or missing scenarios
- [ ] Outcome: report prints copy-paste commands for re-provisioning the sandbox via the worktree CLI and launching a Claude Code session with the worktree's plugin dir
- [ ] Outcome: skill is internal, manual-only, and does not execute any sandbox or Claude commands

> Test strategy: manual, edit a plugin skill in a worktree, invoke the skill, confirm the report flags the scenario mismatch and prints commands that actually run against the worktree's `src/cli.ts` and `claude/` dir

### Preserve renames in git-stage

- [ ] Outcome: `git-stage` keeps rename markers so `git mv`'d files commit as renames, not duplicate add-plus-stale-delete
- [ ] Outcome: skill text handles `R` status alongside the existing `D` and `A/M` rules

> Test strategy: manual, stage a rename with `git mv`, invoke `git-stage`, confirm the resulting commit shows the file as renamed, not as add + delete

### Scope tracked-file reads to worktree in claude-docs

- [ ] Outcome: `claude-docs` Step 1 explicitly scopes tracked-file reads and edits to the current worktree, not the main root
- [ ] Outcome: only Step 4's scratch sweep resolves to the main root

> Test strategy: manual, run `claude-docs` inside a linked worktree with changes to commit, confirm the TASKS.md edit lands in the worktree's tree and not in main's uncommitted state
