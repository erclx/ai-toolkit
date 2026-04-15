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

One section only: Up next. Completed task blocks move to `.claude/TASKS-ARCHIVE.md`. When Up next has no real tasks, keep the `### Nothing queued` placeholder. Remove it when adding the first real task.

Task block format:

```markdown
### Title

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Up next

### Systematic debugging skill for root-cause enforcement

Adapt the root-cause-first pattern from `obra/superpowers` into a toolkit-native skill that auto-triggers on bug reports and test failures. Forces a brief investigation loop before Claude proposes a fix, and demands an architectural rethink after three failed attempts. See `.claude/plans/systematic-debugging-skill.md` for scope decisions and execution steps.

- [ ] Outcome: when a test fails or a bug surfaces mid-session, Claude states a hypothesis and tests one variable before drafting a fix
- [ ] Outcome: after three failed fix attempts the skill stops further fixes and prompts for architectural review
- [ ] Outcome: the trigger does not fire on trivial edits where no failure has been observed

> Test strategy: manual, seed a failing test in a sandbox project and verify the skill auto-activates, the hypothesis step is taken, and the three-fix circuit-breaker engages.

### Reconcile overlap across agent documentation surfaces

Each rule or knowledge item should live in exactly one of three surfaces: project instructions, domain-scoped skills, narrative references. Today the same guidance appears in more than one place, creating drift risk as the repo grows. See `.claude/plans/agent-docs-audit.md` for ownership rules and execution steps.

- [ ] Outcome: every agent-facing rule has a single canonical owner and non-canonical mentions become pointers
- [ ] Outcome: ownership rules are documented in one agent-readable location so future edits know where to place new content
- [ ] Outcome: the drift-check mechanism is either verified as sufficient or a gap is recorded

> Test strategy: manual, spot-check three previously-duplicated rules and confirm they now appear in one surface with pointers from the others.

### Init-project skill for one-shot toolkit setup

Orchestrates the onboarding chain so a freshly scaffolded project is toolkit-ready in a single skill invocation. Pairs with `gov-install` which handles the governance leg. Skill detects package manager and tech, then chains the toolkit installers with sensible defaults.

- [x] A single skill invocation in a new project runs init, governance install, standards install, snippets install, and claude init
- [x] Skill detects project type from root files and picks matching stacks and categories from each domain's catalog
- [x] Skill surfaces each step and its resolved arguments in a preview before executing
- [x] Skill handles gaps (no matching rule or stack) by deferring to the relevant author skill instead of guessing

> Test strategy: manual, run the skill in a sandbox project with known fixtures (Astro, React, Python) and verify the resolved chain for each.
