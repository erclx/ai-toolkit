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

### Claude worktree skill

Plan: .claude/plans/feature-claude-worktree-skill.md

- [ ] Outcome: new `claude-worktree` workflow skill that enters a worktree with a name derived from active plan, branch, or feature context rather than prompting for one
- [ ] Outcome: integrates with `claude-feature` so the plan-to-execute handoff lands in a fresh worktree in one step
- [ ] Outcome: `wiki/claude-worktrees.md` gains a section on the in-session `EnterWorktree` and `ExitWorktree` tools, since the skill assumes the reader knows they exist
- [ ] Outcome: documented in `docs/claude.md` skill table alongside the other `claude-*` workflow skills

> Test strategy: manual, run `claude-feature` on a real feature, invoke the skill at the plan-to-execute boundary, confirm the worktree lands on a meaningfully named branch without manual naming

### Publicize the toolkit repository

Plan: .claude/plans/chore-publicize-repository.md

- [ ] Outcome: top-level `README.md` rewritten as a user-facing pitch with positioning, prerequisites, and quickstart
- [ ] Outcome: personal references audited and generalized so an outside clone works without edits
- [ ] Outcome: an outside developer can clone the repo, install prerequisites, and run `aitk init` in a fresh project without reading the source
- [ ] Outcome: link to the toolkit from public profile surfaces (GitHub pinned, resume, portfolio)

> Test strategy: manual, clone the repo into a fresh path on a machine with only prerequisites installed, follow the README as written, confirm `aitk init` produces a working target project without undocumented steps

### Claude sandbox seed injection rollout

Plan: .claude/plans/feature-sandbox-seed-rollout.md

- [ ] Outcome: 7 claude sandboxes refactored to use `SANDBOX_INJECT_SEEDS=true` with scenario-specific overlays: autoship, design-extract, design-propose, docs, feature, review, ux-audit
- [ ] Outcome: `init-project.sh` stays hand-rolled as the documented exception since it tests `aitk init` itself
- [ ] Outcome: `docs/sandbox.md` updated with the rule that claude/ scenarios default to inject unless they test the install flow

> Test strategy: manual, run each refactored scenario and invoke the skill it tests, confirm the skill finds the seed files it expects without behavior drift

### Stitch MCP integration

Plan: .claude/plans/feature-stitch-mcp-integration.md

- [ ] Outcome: `aitk design sync` provisions DESIGN.md tokens into a Stitch project via MCP
- [ ] Outcome: `aitk design generate`, `edit`, `variants`, `list` wrap the remaining Stitch MCP tools
- [ ] Outcome: documented auth path, credit budget, and training-opt-out guardrail

> Test strategy: manual, full cycle against a live Stitch account with a disposable API key, sandbox scenario optional

### Tool experiment scaffold skill

Plan: .claude/plans/feature-experiment-template.md

- [ ] Outcome: `/experiment <tool>` skill scaffolds `.claude/.tmp/<tool>/notes.md` with the fixed phase structure used in the Claude Design and Stitch runs
- [ ] Outcome: scaffold includes an in-file reminder of the `?`-until-verified rule and a wiki-shaped synthesis block at the end
- [ ] Outcome: next new-tool investigation uses the skill and produces a wiki draft without rebuilding the phase structure by hand

> Test strategy: manual, run `/experiment <fake-tool>` against a real or mocked tool, confirm the scaffold appears at the expected path with phases intact, then drive one short investigation through it

### Chrome delegation for web research

Plan: .claude/plans/feature-chrome-delegation.md

- [ ] Outcome: decision on whether Claude Code in Chrome can drive web-based experiments (navigate, screenshot, report) with a prompt template
- [ ] Outcome: if viable, a snippet or skill that kicks off a web-research run with a predetermined prompt shape

> Test strategy: manual, one experiment routed through the Chrome path and compared against the manual-copy-paste baseline

### Shipping-from-worktrees wiki section

- [ ] Outcome: `wiki/claude-worktrees.md` gains a "Shipping from worktrees" section covering rotate-after-merge, rebase-before-PR, and merge-order advice for multiple concurrent worktrees
- [ ] Outcome: section points at the future `git-worktree` skill for the mechanical parts once it exists

> Test strategy: manual, walk the section end-to-end against a fresh fan-out scenario and confirm a reader can execute without asking

### Git worktree lifecycle skill

- [ ] Outcome: new `git-worktree` plugin skill with `list` (worktrees plus branch merge status), `cleanup` (remove worktrees for merged branches, prune local branches), and `rotate` (switch the current worktree to a fresh branch off main)
- [ ] Outcome: skill invoked at session start or after shipping a PR to reclaim worktree slots without manual `git worktree remove` dance
- [ ] Outcome: documented in `docs/claude.md` skill table and referenced from the shipping-from-worktrees wiki section

> Test strategy: manual, spin up two worktrees, ship one, run the skill, confirm it proposes removing the merged one and rotating the other if asked
