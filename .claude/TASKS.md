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

### Chrome delegation for web research

Plan: .claude/plans/feature-chrome-delegation.md

- [ ] Outcome: decision on whether Claude Code in Chrome can drive web-based experiments (navigate, screenshot, report) with a prompt template
- [ ] Outcome: if viable, a snippet or skill that kicks off a web-research run with a predetermined prompt shape

> Test strategy: manual, one experiment routed through the Chrome path and compared against the manual-copy-paste baseline

### Shipping-from-worktrees wiki section

Plan: .claude/plans/feature-worktree-lifecycle.md

- [x] Outcome: `wiki/claude-worktrees.md` gains a "Shipping from worktrees" section covering rotate-after-merge, rebase-before-PR, and merge-order advice for multiple concurrent worktrees
- [x] Outcome: section points at the future `git-worktree` skill for the mechanical parts once it exists

> Test strategy: manual, walk the section end-to-end against a fresh fan-out scenario and confirm a reader can execute without asking

### PR follow-up skill

Plan: .claude/plans/feature-git-pr-followup-skill.md

- [ ] Outcome: new `git-pr-followup` plugin skill that commits a fix, pushes, and reconciles the PR body against the new state when drift is detected
- [ ] Outcome: sandbox scenario exercises the commit + push path with a `gh` stub, with live PR edit testing documented as manual
- [ ] Outcome: documented in `docs/claude.md` skills table alongside the other `git-*` skills

> Test strategy: manual, open a PR via `git-ship`, introduce a fix that changes a file named in Key Changes and a fix that adds a new file, confirm the skill flags the second as body drift and leaves the first alone

### Memory review sandbox scenario

Plan: .claude/plans/chore-memory-review-sandbox.md

- [ ] Outcome: `scripts/sandbox/claude/memory.sh` seeds `.claude/memory/` with a representative mix of promote-worthy, absorbed, and stale entries plus a `MEMORY.md` index
- [ ] Outcome: scenario exercises the classification, review-file write, apply, and review-file cleanup paths end to end
- [ ] Outcome: closes the sandbox gap flagged when the new "draft a sandbox alongside SKILL.md" rule landed in `aitk-claude`

> Test strategy: manual, run `aitk sandbox claude:memory`, invoke `/toolkit:claude-memory-review` against the seeded state, confirm the review file appears at `.claude/review/memory-review-<slug>.md` and the approved items apply cleanly

### Git worktree lifecycle skill

Plan: .claude/plans/feature-worktree-lifecycle.md

- [x] Outcome: new `git-worktree` plugin skill with `list` (worktrees plus branch merge status), `cleanup` (remove worktrees for merged branches, prune local branches), and `rotate` (switch the current worktree to a fresh branch off main)
- [x] Outcome: skill invoked at session start or after shipping a PR to reclaim worktree slots without manual `git worktree remove` dance
- [x] Outcome: documented in `docs/claude.md` skill table and referenced from the shipping-from-worktrees wiki section

> Test strategy: manual, spin up two worktrees, ship one, run the skill, confirm it proposes removing the merged one and rotating the other if asked

### Claude worktree sandbox scenario

Plan: .claude/plans/chore-claude-worktree-sandbox.md

- [ ] Outcome: `scripts/sandbox/claude/worktree.sh` provisions fixtures exercising the multi-plan tier, the plan-matches-branch tier, and the no-plan branch tier
- [ ] Outcome: scenario cleanup handles `.claude/worktrees/<name>/` removal via `git worktree remove` and prunes the post-rename branch
- [ ] Outcome: closes the sandbox gap left when `claude-worktree` shipped without one, restoring parity with the other claude-\* skills

> Test strategy: manual, run `aitk sandbox claude:worktree`, invoke `/toolkit:claude-worktree` against each scenario branch, confirm the skill lands in `.claude/worktrees/<slug>/` on branch `<slug>` (post-rename) without prompting for a name on the matched-plan tier

### Sequential PR merge loop skill

Plan: .claude/plans/feature-git-merge-loop.md

- [ ] Outcome: new `git-merge-loop` plugin skill that walks multiple open sibling PRs through sequential squash-merge with a rebase between each, regardless of how the branches were created
- [ ] Outcome: handles both independent siblings off `main` (worktree fan-out shape) via `git rebase origin/main` and stacked siblings via `git rebase --onto origin/main HEAD~<own-commit-count>`, picking the mode by detection or an explicit mode arg
- [ ] Outcome: merge order picked by shared-hotspot overlap per the "Shipping from worktrees" wiki rules, smallest hotspot delta first
- [ ] Outcome: `git-split`'s existing Stacked merge loop migrates into this skill, leaving `git-split` focused on splitting
- [ ] Outcome: documented in `docs/claude.md` skill table alongside the other `git-*` skills

> Test strategy: manual, open three sibling PRs off main that share `docs/claude.md`, run the skill, confirm the rebase-merge-rebase sequence lands all three without manual intervention, then run against a stacked split from `git-split` and confirm the stacked path still works
