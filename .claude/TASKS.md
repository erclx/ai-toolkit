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

### Audit Claude skills for sandbox coverage

Today `scripts/sandbox/` covers CLI commands (`infra/`), gemini commands (`dev/`, `docs/`, etc.), and tooling configs (`tooling/`). It does not cover skills under `claude/skills/`. With several skills now in the toolkit (`claude-feature`, `claude-review`, `claude-ui-test`, `claude-ux-audit`, `claude-autoship`, and more), there is no staged scenario for test-driving any of them.

Goal: audit each skill in `claude/skills/` and produce a shortlist of which warrant a sandbox scenario, the scenario's starting state, and the Action / Expect pair.

- [ ] Outcome: audit output lists each skill with a yes/no/maybe call, a one-line justification, and a proposed scenario shape
- [ ] Outcome: output is a build list the follow-up task can consume directly

> Test strategy: none, planning audit. Validation happens in the follow-up build task.

### Build sandbox scenarios for Claude skills

Depends on the audit above. Scaffold the sandboxes flagged as high value. Start with `claude-autoship` happy path since there is no existing feature in a target project to test it against. Extend with any additional skills the audit recommends.

- [ ] Outcome: new `scripts/sandbox/claude/` category exists with at least `autoship.sh` (happy path)
- [ ] Outcome: each scenario scaffolds a realistic starting state and logs clear Action / Expect lines matching existing patterns in `scripts/sandbox/dev/`
- [ ] Outcome: `docs/sandbox.md` lists the new category and scenarios
- [ ] Outcome: running `aitk sandbox claude:autoship` provisions a `.sandbox/` where `/claude-autoship` can be invoked end-to-end from Claude Code

> Test strategy: manual, run each new sandbox scenario, open Claude Code in `.sandbox/`, invoke the skill, confirm the scenario stages the correct happy-path starting state.

### Reconcile overlap across agent documentation surfaces

Each rule or knowledge item should live in exactly one of three surfaces: project instructions, domain-scoped skills, narrative references. Today the same guidance appears in more than one place, creating drift risk as the repo grows. See `.claude/plans/agent-docs-audit.md` for ownership rules and execution steps.

- [ ] Outcome: every agent-facing rule has a single canonical owner and non-canonical mentions become pointers
- [ ] Outcome: ownership rules are documented in one agent-readable location so future edits know where to place new content
- [ ] Outcome: the drift-check mechanism is either verified as sufficient or a gap is recorded

> Test strategy: manual, spot-check three previously-duplicated rules and confirm they now appear in one surface with pointers from the others.
