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

### Design system overhaul

Plan: .claude/plans/feature-design-system-overhaul.md

- [ ] Outcome: revised `.claude/DESIGN.md` seed with token tables for color, typography, spacing, borders, motion, iconography
- [ ] Outcome: `toolkit:aitk-design-extract` skill drafts DESIGN.md from a project's existing prose and shell UI surfaces
- [ ] Outcome: `aitk design render` writes a one-page HTML plus CSS companion that visualizes the current DESIGN.md tokens

> Test strategy: manual, extract skill runs against the toolkit repo and produces a DESIGN.md that matches the experiment-captured system, render command opens in a browser and shows every token from the seed

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
