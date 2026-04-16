# Tasks archive

Completed tasks moved here from `TASKS.md`. Oldest entries at the top, newest at the bottom.

### Catalog emitters for other domains

Unlocks the detect-pick-execute skill pattern (proven by `gov-install`) for snippets, tooling, and standards. Each emitter is a thin `list.sh` mirroring `scripts/gov/list.sh` with the domain's own catalog files.

- [x] `aitk snippets list` emits available snippet categories and entries with `--json` support
- [x] `aitk tooling list` emits available stacks with extends chain and dep summary, with `--json` support
- [x] `aitk standards list` emits available standards with descriptions and `--json` support

> Test strategy: manual, run each with and without `--json`, parse JSON output via bun and confirm stacks and entries match source files.

### Non-interactive scenario routing across all sandbox scripts

Sandbox `infra/*` scripts already route via `SANDBOX_SCENARIO`, but `git/*`, `dev/*`, and `docs/*` relied on `select_option`'s first-option fallback when non-interactive. This blocked agents from triggering specific scenarios automatically (e.g. running `stacked` after a `git-split` skill change). Added a `select_or_route_scenario` helper to `lib/ui.sh` and switched multi-scenario scripts over, plus slug-renamed scenario names in `git/ship.sh`, `dev/review.sh`, and `docs/sync.sh` so agents can pass them without quoting, and added a hard-error default arm to every case to catch typos.

- [x] Every multi-scenario sandbox script routes to the named scenario when `SANDBOX_SCENARIO` is set
- [x] `aitk sandbox <category>:<command> <scenario>` provisions the right scenario without prompts
- [x] Single-scenario scripts unchanged

> Test strategy: manual, run each multi-scenario script with `aitk sandbox <cat>:<cmd> <scenario>` and verify the matching setup runs without TTY input.

### Init-project skill for one-shot toolkit setup

Orchestrates the onboarding chain so a freshly scaffolded project is toolkit-ready in a single skill invocation. Pairs with `gov-install` which handles the governance leg. Skill detects package manager and tech, then chains the toolkit installers with sensible defaults.

- [x] A single skill invocation in a new project runs init, governance install, standards install, snippets install, and claude init
- [x] Skill detects project type from root files and picks matching stacks and categories from each domain's catalog
- [x] Skill surfaces each step and its resolved arguments in a preview before executing
- [x] Skill handles gaps (no matching rule or stack) by deferring to the relevant author skill instead of guessing

> Test strategy: manual, run the skill in a sandbox project with known fixtures (Astro, React, Python) and verify the resolved chain for each.

### Systematic debugging skill for root-cause enforcement

Adapt the root-cause-first pattern from `obra/superpowers` into a toolkit-native skill that auto-triggers on bug reports and test failures. Forces a brief investigation loop before Claude proposes a fix, and demands an architectural rethink after three failed attempts. See `.claude/plans/systematic-debugging-skill.md` for scope decisions and execution steps.

- [x] Outcome: when a test fails or a bug surfaces mid-session, Claude states a hypothesis and tests one variable before drafting a fix
- [x] Outcome: after three failed fix attempts the skill stops further fixes and prompts for architectural review
- [x] Outcome: the trigger does not fire on trivial edits where no failure has been observed

> Test strategy: manual, seed a failing test in a sandbox project and verify the skill auto-activates, the hypothesis step is taken, and the three-fix circuit-breaker engages.

### Persist skill outputs to `.claude/`

Move `claude-feature`, `claude-review`, and `claude-ui-test` outputs into readable files under `.claude/`. Plan files are tracked. Review files are gitignored and overwritten on each run. Stale feature plans are swept by `claude-docs` as part of the ship flow. See `.claude/plans/persist-skill-outputs.md` for design and execution steps.

- [x] Outcome: running `claude-feature` writes its plan to `.claude/plans/feature-<slug>.md` in addition to chat
- [x] Outcome: running `claude-review` and `claude-ui-test` writes outputs to files under `.claude/review/` that are gitignored
- [x] Outcome: `git-ship` automatically removes stale feature plans via the `claude-docs` step

> Test strategy: manual, run each skill in a sandbox project, inspect the written files, then run `git-ship` and confirm feature plans are swept.

### Subagent pattern wiki page

The toolkit now uses subagents in `claude-autoship` to run `claude-review` with cold-reviewer independence. The pattern is not documented as its own page. Mentions are scattered across `wiki/claude-hooks.md`, `wiki/claude-skills.md`, and `wiki/community-skills.md`. Skill authors have no single reference for when and how to reach for a subagent.

Goal: add `wiki/claude-subagents.md` covering how subagents scope context, the three cases to reach for them in a skill (independence, context isolation, parallel lenses), parallel vs sequential invocation, and pitfalls. Use the `claude-code-guide` agent in a fresh session for current Anthropic docs.

- [x] Outcome: `wiki/claude-subagents.md` exists with a decision guide for skill authors
- [x] Outcome: `wiki/index.md` links to the new page
- [x] Outcome: scattered mentions in other wiki pages link to the new page where relevant

> Test strategy: manual, cross-read with `wiki/claude-skills.md` and `claude/skills/claude-autoship/SKILL.md` to confirm claims about subagent scoping align.

### Sync seed preamble updates into existing target projects

When a seed doc changes (new rule in `CLAUDE.md`, revised preamble in `TASKS.md`, updated key paths), projects that were init'd earlier do not receive the update. `aitk claude sync` today only updates managed role prompts (`PLANNER.md`, `REVIEWER.md`, `IMPLEMENTER.md`). Seed docs are left alone because target projects customize them after init. Manually reconciling sections across projects is slow and error-prone.

Approach: keep the CLI dumb. `aitk claude seeds list --json` (and the symmetric `roles list`) emits seed sources with content. The `claude-seed-sync` plugin skill diffs against the project's installed copies in-context and proposes per-section edits. No three-way merge, no manifest.

- [x] Outcome: running one command from a target project shows which sections of each seed doc differ from the toolkit's current seed
- [x] Outcome: the user can apply per-section with explicit confirmation, section by section
- [x] Outcome: sections the user has customized are never overwritten without an explicit accept
- [x] Outcome: works for all seed docs, not just `CLAUDE.md`

> Test strategy: manual, change a section in the toolkit seed, run the sync flow from a sandbox target that was init'd before the change, confirm the diff surfaces and selected sections apply while untouched ones stay intact.

### Audit Claude skills for sandbox coverage

Today `scripts/sandbox/` covers CLI commands (`infra/`), gemini commands (`dev/`, `docs/`, etc.), and tooling configs (`tooling/`). It does not cover skills under `claude/skills/`. With several skills now in the toolkit (`claude-feature`, `claude-review`, `claude-ui-test`, `claude-ux-audit`, `claude-autoship`, and more), there is no staged scenario for test-driving any of them.

Goal: audit each skill in `claude/skills/` and produce a shortlist of which warrant a sandbox scenario, the scenario's starting state, and the Action / Expect pair.

- [x] Outcome: audit output lists each skill with a yes/no/maybe call, a one-line justification, and a proposed scenario shape
- [x] Outcome: output is a build list the follow-up task can consume directly

> Test strategy: none, planning audit. Validation happens in the follow-up build task.

### Build sandbox scenarios for Claude skills

Depends on the audit above. Scaffold the sandboxes flagged as high value. Start with `claude-autoship` happy path since there is no existing feature in a target project to test it against. Extend with any additional skills the audit recommends.

- [x] Outcome: new `scripts/sandbox/claude/` category exists with at least `autoship.sh` (happy path)
- [x] Outcome: each scenario scaffolds a realistic starting state and logs clear Action / Expect lines matching existing patterns in `scripts/sandbox/dev/`
- [x] Outcome: `docs/sandbox.md` lists the new category and scenarios
- [x] Outcome: running `aitk sandbox claude:autoship` provisions a `.sandbox/` where `/claude-autoship` can be invoked end-to-end from Claude Code

> Test strategy: manual, run each new sandbox scenario, open Claude Code in `.sandbox/`, invoke the skill, confirm the scenario stages the correct happy-path starting state.

### Reconcile overlap across agent documentation surfaces

Each rule or knowledge item should live in exactly one of three surfaces: project instructions, domain-scoped skills, narrative references. Today the same guidance appears in more than one place, creating drift risk as the repo grows. See `.claude/plans/agent-docs-audit.md` for ownership rules and execution steps.

- [x] Outcome: every agent-facing rule has a single canonical owner and non-canonical mentions become pointers
- [x] Outcome: ownership rules are documented in one agent-readable location so future edits know where to place new content
- [x] Outcome: the drift-check mechanism is either verified as sufficient or a gap is recorded

> Test strategy: manual, spot-check three previously-duplicated rules and confirm they now appear in one surface with pointers from the others.

### Eliminate double-write in skills that persist output

`claude-feature`, `claude-review`, `claude-ux-audit`, and `claude-ui-test` all generate output twice: once in chat, then the same content to a file. This wastes tokens and makes the user wait through duplicate generation. Each skill should write the file directly and output only the path.

- [x] Outcome: all four skills write output to file only, then print the path
- [x] Outcome: `claude-autoship` still reads `.claude/review/review-<slug>.md` without changes (file contract unchanged)

> Test strategy: manual, invoke each skill in its sandbox and confirm output appears only in the file with the path shown in chat.

### Autoship should inline git-ship steps instead of invoking it

`claude-autoship` step 7 calls `toolkit:git-ship`, but git-ship has `disable-model-invocation: true` which blocks the Skill tool. Claude works around it by reimplementing the steps ad-hoc, which is fragile and incomplete. Observed failures include no PR opened and the plan file deleted prematurely. Autoship should own the ship sequence directly, covering docs-sync, commit by concern, branch rename, push, and PR open, instead of delegating to a restricted skill.

- [x] Outcome: autoship step 7 lists the ship sub-steps inline in SKILL.md
- [x] Outcome: git-ship remains `disable-model-invocation: true` (no change)
- [x] Outcome: autoship sandbox completes end-to-end including PR creation

> Test strategy: manual, run `/claude-autoship` in `claude:autoship` sandbox and confirm PR opens on `erclx/toolkit-sandbox`.

### Drop the autoship cold review subagent

Two sandbox runs showed the cold review subagent is unreliable. The first run over-explored with 25 tool calls and 17.5k tokens for a 4-line diff. The second run inherited the wrong working directory, produced a broken review, and ignored its "do not explore" constraint on retry. Invoke the skill directly from the main session instead.

- [x] Outcome: autoship step 5 invokes `claude-review` directly without a subagent
- [x] Outcome: sandbox autoship completes end-to-end with the direct-invocation review

> Test strategy: manual, run `/claude-autoship` in `claude:autoship` sandbox and confirm the review step produces a valid findings file and the pipeline opens a PR.

### Chore: research visual tooling to augment claude wireframes

- [x] Outcome: a wiki page compares candidate tools across Claude Code integration, format readability, license, and install footprint
- [x] Outcome: the wiki page names a recommended tool and a sketch of how it sits alongside the ASCII wireframe doc
- [x] Outcome: the page records a decision to proceed to integration, defer, or drop

> Test strategy: manual, open the wiki page and confirm it covers candidate tools, trade-offs, and a final decision

### Chore: research a curated MCP server list for the wiki

- [x] Outcome: a wiki page lists MCP servers with transport, license, cost, and maintenance status
- [x] Outcome: the page separates development and productivity categories
- [x] Outcome: the page names must-have servers distinct from niche picks
- [x] Outcome: the page links to upstream registries or curated lists for cross-reference

> Test strategy: manual, open the wiki page and confirm it distinguishes must-have from niche across development and productivity categories

### Chore: remove the project snapshot script from claude tooling

- [x] Outcome: `aitk claude init` no longer installs a snapshot script into target projects
- [x] Outcome: claude tooling docs no longer reference the snapshot command

> Test strategy: manual, run `aitk claude init` in a fresh target and confirm the snapshot script is not present

### Chore: collapse claude out of the tooling stack interface

- [x] Outcome: `aitk tooling list` no longer shows claude as a stack
- [x] Outcome: `aitk tooling sync claude` fails or is unavailable
- [x] Outcome: `aitk claude` is the only documented surface for installing and syncing claude assets
- [x] Outcome: tooling docs note the claude exception

> Test strategy: manual, run `aitk tooling list` and confirm claude is absent, then run `aitk tooling sync claude` and confirm it exits cleanly

### Feature: aitk sync includes claude role drift

- [x] Outcome: `aitk sync` detects the claude workflow directory and runs role sync alongside other domains
- [x] Outcome: role drift appears in the combined sync PR body under a claude domain line
- [x] Outcome: `aitk sync` prints a seed-sync skill hint when claude is present
- [x] Outcome: seed audits remain a manual skill invocation

> Test strategy: manual, run `aitk sync` against a target with claude roles installed and verify role drift lands in the combined PR
