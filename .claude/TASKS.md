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

### Chore: remove the project snapshot script from claude tooling

- [x] Outcome: `aitk claude init` no longer installs a snapshot script into target projects
- [x] Outcome: claude tooling docs no longer reference the snapshot command

> Test strategy: manual, run `aitk claude init` in a fresh target and confirm the snapshot script is not present

### Chore: collapse claude out of the tooling stack interface

Plan: `.claude/plans/feature-collapse-claude-stack.md`

- [x] Outcome: `aitk tooling list` no longer shows claude as a stack
- [x] Outcome: `aitk tooling sync claude` fails or is unavailable
- [x] Outcome: `aitk claude` is the only documented surface for installing and syncing claude assets
- [x] Outcome: tooling docs note the claude exception

> Test strategy: manual, run `aitk tooling list` and confirm claude is absent, then run `aitk tooling sync claude` and confirm it exits cleanly

### Feature: aitk sync includes claude role drift

Plan: `.claude/plans/feature-sync-claude-drift.md`

- [x] Outcome: `aitk sync` detects the claude workflow directory and runs role sync alongside other domains
- [x] Outcome: role drift appears in the combined sync PR body under a claude domain line
- [x] Outcome: `aitk sync` prints a seed-sync skill hint when claude is present
- [x] Outcome: seed audits remain a manual skill invocation

> Test strategy: manual, run `aitk sync` against a target with claude roles installed and verify role drift lands in the combined PR

### Chore: research visual tooling to augment claude wireframes

Plan: `.claude/plans/research-visual-wireframe-tooling.md`

- [x] Outcome: a wiki page compares candidate tools across Claude Code integration, format readability, license, and install footprint
- [x] Outcome: the wiki page names a recommended tool and a sketch of how it sits alongside the ASCII wireframe doc
- [x] Outcome: the page records a decision to proceed to integration, defer, or drop

> Test strategy: manual, open the wiki page and confirm it covers candidate tools, trade-offs, and a final decision

### Chore: research a curated MCP server list for the wiki

Plan: `.claude/plans/research-curated-mcp-list.md`

- [x] Outcome: a wiki page lists MCP servers with transport, license, cost, and maintenance status
- [x] Outcome: the page separates development and productivity categories
- [x] Outcome: the page names must-have servers distinct from niche picks
- [x] Outcome: the page links to upstream registries or curated lists for cross-reference

> Test strategy: manual, open the wiki page and confirm it distinguishes must-have from niche across development and productivity categories
