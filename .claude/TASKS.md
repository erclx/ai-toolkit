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

### Greenfield design proposal skill

- [ ] Outcome: `claude-design-propose` skill drafts `.claude/DESIGN.md` from `REQUIREMENTS.md`, `ARCHITECTURE.md`, and a personality prompt, with token values proposed by the agent
- [ ] Outcome: skill runs on day one of a project before any UI code exists and replaces the Claude Design quota cost for greenfield design work
- [ ] Outcome: sandbox scenario at `scripts/sandbox/claude/design-propose.sh` provisions a fresh project with only `REQUIREMENTS.md` and a personality paragraph, no code

> Test strategy: manual, run the sandbox, invoke the skill, eyeball whether the proposed DESIGN.md fits the seeded personality and renders cleanly via `aitk design render`

### Stitch MCP integration

Plan: .claude/plans/feature-stitch-mcp-integration.md

- [ ] Outcome: `aitk design sync` provisions DESIGN.md tokens into a Stitch project via MCP
- [ ] Outcome: `aitk design generate`, `edit`, `variants`, `list` wrap the remaining Stitch MCP tools
- [ ] Outcome: documented auth path, credit budget, and training-opt-out guardrail

> Test strategy: manual, full cycle against a live Stitch account with a disposable API key, sandbox scenario optional

### Experiment template pattern

- [ ] Outcome: snippet or skill that formalizes the step-by-step experiment form used during the Claude Design and Stitch runs
- [ ] Outcome: explicit rule baked in that model-prior guesses are marked `?` and verified via screenshot or direct observation before being committed as facts

> Test strategy: manual, next new-tool experiment uses the template and the notes capture screenshots as the source of truth

### Chrome delegation for web research

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
