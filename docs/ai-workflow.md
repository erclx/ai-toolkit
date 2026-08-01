---
title: AI workflow
description: Overarching AI workflow across domains
category: Agent surface
---

# AI workflow reference

A concise reference for when to reach for which tool, organized by what you're trying to do.

> **Mental model:** Claude Code for everything: planning, implementation, review, docs, git, and release.

## Documents

Project docs live in `.claude/` at the project root.

```plaintext
.claude/
├── REQUIREMENTS.md  ← goals, non-goals, MVP scope
├── ARCHITECTURE.md  ← technical design decisions
├── DESIGN.md        ← visual intent and token decisions (UI projects)
├── WIREFRAMES.md    ← ASCII wireframes: layout, UI copy, and interaction rules (UI projects)
├── tasks/           ← one file per task with a generated index.md, gitignored local scratch
├── context/         ← per-domain narrative loaded on demand via index.md
└── rules/           ← path-scoped governance rules, written by aitk gov install
```

Three tiers of context load with different cost: always-loaded (root `CLAUDE.md`, `.claude/REQUIREMENTS.md`, `.claude/ARCHITECTURE.md`), path-scoped lazy (`.claude/rules/<scope>.md` with `paths:` glob), and on-demand lookup (`.claude/context/<domain>.md` discovered via `.claude/context/index.md`). See [the context model](../.claude/context/context-model.md) for the full picture.

Run `aitk init` to seed the `.claude/` directory, a root `CLAUDE.md` file, and `.claude/rules/` in one pass. `aitk init` chains claude init and governance install. Claude Code auto-loads every file in `.claude/rules/` at session start, applying always-on rules unconditionally and path-scoped rules to files matching their `paths:` glob.

## Scenarios

### Bootstrap a new project

See [target projects](target-projects.md) for the scaffold decision, core domains and skips, and the full lifecycle across scaffold, add-a-domain-later, and upstream sync.

### New feature

One session works for most features. Prefer splitting across two sessions only when the feature is large enough that you want a cold, independent reviewer on the diff. Plan and implement in session 1, then review and ship in session 2.

#### Session 1

Work in Claude Code directly. It reads `CLAUDE.md` automatically and has full file access, no pasting needed.

- When the current state is unmeasured and more than one approach is live, invoke `aitk:claude-groundwork` first. It opens a scratch folder under `.claude/.tmp/groundwork/<slug>/` and ends in a decision, which may be to do nothing. Skip it when the approach is already settled. A track may run experiments to settle a question, writing a fixture it reads itself under `.claude/.tmp/groundwork-fixtures/<slug>/` and spawning up to three billed headless runs before it asks. A fixture a headless run is pointed at sits outside the repository, since a session started under the project root inherits that project's `CLAUDE.md` and rules and would measure them instead of the arm.
- Invoke `aitk:claude-feature` to scan for code-level conflicts and ambiguities, confirm approach before proceeding
- Implement the feature, then Claude Code runs the commands defined in `CLAUDE.md`, fixes failures, and iterates until all pass
- For UI changes, invoke `aitk:claude-ui-test` to generate and run Playwright e2e tests
  End the session once the feature works and tests pass. Invoke `aitk:claude-docs` to capture any decisions made during implementation before closing.

#### Session 2

Start a fresh Claude Code session. The diff is sufficient context for both review and ship.

- Invoke `aitk:claude-review` to review all changes since main and output a findings report
- Fix any valid findings
- Invoke `aitk:git-ship` to sync docs, commit by concern, rename branch, and open PR

### Parallel features

When features are independent, run them in parallel instead of sequentially. Use one git worktree per feature so each session has its own working tree and branch.

- Create a worktree per feature, then start a Claude Code session in each
- Invoke `aitk:claude-feature` in each session. Plans land at the main worktree root as `.claude/plans/feature-<slug>.md`, one per feature, no collisions. Small features stay in chat and skip the file.
- Implement, verify, and review each feature independently. `claude-review` and `claude-ui-test` write per-branch files at the main worktree root (`review-<branch>.md`, `ui-checklist-<branch>.md`), so parallel sessions do not overwrite each other
- Ship each worktree separately with `aitk:git-ship`
- For full autonomy per worktree, invoke `aitk:claude-autoship` instead of the manual chain. Approve the plan, walk away, come back to draft PRs.

To run several worktrees as a coordinated flow rather than ad hoc, assert the orchestrator role in one warm session with `aitk:claude-orchestrate`. It owns the roadmap via `aitk:claude-roadmap`, plans each feature, and reviews each worker's PR with `aitk:claude-pr-review`, while workers address the posted findings with `aitk:claude-address-review`. The human launches workers and merges. See [operating model](../wiki/operating-model.md) for the full loop.

`.claude/plans/`, `.claude/review/`, and `.claude/memory/` all resolve at the main worktree root, so artifacts created in any session are visible from any sibling worktree. See [Claude Code and git worktrees](../wiki/claude-worktrees.md) for the full rule and the domain-level fan-out guidance.

A plan that ships is archived, never deleted. `aitk:claude-docs` moves it to `.claude/.tmp/plans-archive/` and retargets the task file's `Plan:` line at the new location, so a completed task still leads to the reasoning behind it. Both folders are gitignored, which is why a deleted plan had no recovery path. A plan cited by more than one task stays put until the last of them closes, since moving it early would strand every other pointer.

The sweep reads the whole board rather than the tasks the session touched. It is the one place the skill reaches past its own rule against editing a task file the session did not change, because a task that closed while an earlier run missed its archive is exactly what the sweep exists to clear. Reaching it is safe: the archive moves the plan and retargets the pointer in the same pass, so an untouched task ends up with a working link rather than a broken one.

`aitk:claude-docs` decides which task closed by reading the diff rather than the conversation. It resolves a merge base against `origin/main`, unions the committed diff with the working tree and untracked files, then matches unchecked outcomes on the board against what shipped. A task that shipped without ever being discussed still gets marked. Requirements, architecture, and design stay session-sourced, because a diff cannot carry a judgment.

`.claude/tasks/` is gitignored and resolves at the main worktree root, so every session shares one board. One file per task is what keeps concurrent sessions from overwriting each other, since a gitignored board has no history to recover a lost write from. Its `index.md` is generated by a hook rather than by `bun run check`, because the whole-repo index walk skips gitignored folders. A hand-maintained `priority.md` sits beside it carrying execution order and what each task is waiting on, which the alphabetical index cannot express.

`aitk:claude-tasks` owns the two operations that bracket a task's life. It creates the file, holding the filename convention and the frontmatter contract so a malformed write cannot break the index for every sibling, and it moves a shipped task to `.claude/.tmp/task-archive/`. Creation is where the origin invariant is enforced: every task names a plan, a groundwork folder, or an issue, since a task with no origin is either lost context or work nobody decided to do. Archiving a task leaves its plan alone, because `aitk:claude-docs` owns the plans sweep and already holds the last-live-citation rule. That makes the order load-bearing, so the archive verb refuses to run while the `Plan:` line still points into `.claude/plans/`. The sweep only reaches tasks still in the live folder, and archiving the task first would strand the plan there with nothing citing it.

Nothing chained that archive until the `post-merge` git hook landed. Every earlier step fires from `aitk:claude-autoship` or `aitk:git-ship`, both of which finish while the pull request is still open, so a task archived there would close for work that may be abandoned. The board is gitignored, which rules out reading it from anywhere but the machine that pulled. The hook names the board's archive candidates and stays silent otherwise, including on a project with no board.

Candidates rather than closed tasks, because outcomes are marked on the branch. A task can read all `[x]` while its pull request is still open, so `aitk:claude-tasks` confirms the work reached `main` before it moves anything, and the hook's own output says that check is still owed. A companion `post-rewrite` hook carries the same announcement for anyone pulling with rebase, which fires that event instead of `post-merge`.

It announces and moves nothing, so `aitk:claude-tasks` stays the only writer. A shell-side archive would change a gitignored board with no diff to review and no session watching, and `index.md` regenerates from a session hook that a shell `mv` never fires. Both hooks ship with the `base` tooling stack, so a target project running this workflow gets the same trigger.

### Autonomous ship

For features on a mature stack, chain the post-plan pipeline in one session. Approve the plan, invoke `aitk:claude-autoship`, and the skill runs implement → verify → review → ship sequentially.

- Use when the plan is tight and the stack has real verify commands and test coverage
- Autoship stops on: verify failure after one fix attempt, UI manual checklist non-empty, any review finding above minor, no diff baseline resolving against `main`, an empty changed-file list, or hook failure
- Review is skipped entirely when the diff is prose-only (every changed file matches `*.md` or `*.txt`). Prose changes are gated by `docs-sync`, `claude-standards-audit`, and pre-push hooks.
- An empty changed-file list stops the chain rather than counting as prose-only. The filename test passes vacuously on an empty set, which routed a branch past review instead of through it.
- Every stop leaves recoverable state. Fix and resume with `/git-ship`
- Skip autoship for auth, migrations, security-sensitive changes, or work where the plan itself is uncertain
- After the PR is open, both `autoship` and `git-ship` invoke `claude-memory-capture` to write session patterns into `.claude/memory/`. If capture wrote at least one entry, `claude-memory-review` then proposes a decision-ready fix scoped to those captures while context is fresh, otherwise it is skipped. They stop at Propose. Review the receipt and run Apply yourself, on its own commit separate from the feature. Run `claude-memory-review` standalone to curate the whole pen.

### UI polish

Verify the change manually in the browser. Invoke `aitk:claude-ui-test` if you need e2e tests and a visual verification checklist for the session. For the fix itself, describe the change in Claude Code directly.

### Quick fix

- Verify failure or isolated bug → continue in Claude Code (it has the implementation context)
- Design or planning conflict → escalate to a new Claude chat session with the relevant plan context
- Fast file edit (a task file, config, renaming) → Claude Code directly, no chat needed

### Review

Invoke `aitk:claude-review` at the start of session 2. It reads all changed files and outputs a findings report. Fix valid findings before invoking `aitk:git-ship`. If nothing is valid, skip directly to ship.

### UI-heavy project

Before the first feature session on a UI-heavy project, pick a design tier. The tier determines seed shape, installed MCP servers, and installed plugin skills. See [visual design workflow](../wiki/visual-design-workflow.md) for the framework and decision guide.

## Skills

| Skill                        | When to use                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `aitk:claude-groundwork`     | Before a plan is warranted, measure an unknown in a scratch folder under `.claude/.tmp/groundwork/`                    |
| `aitk:claude-feature`        | Before implementation, scan for conflicts and ambiguities                                                              |
| `aitk:claude-roadmap`        | Sequence MVP scope into ordered versions in `.claude/ROADMAP.md`                                                       |
| `aitk:claude-orchestrate`    | Assert the orchestrator role and dispatch the roadmap, feature, and review skills                                      |
| `aitk:claude-diagram`        | Draft `.claude/DIAGRAMS.md` with mermaid diagrams from architecture and code                                           |
| `aitk:claude-design-propose` | Day one on a UI project, draft `.claude/DESIGN.md` from requirements. Use `claude-design-extract` if UI already exists |
| `aitk:claude-review`         | In a fresh session, review all changes since main                                                                      |
| `aitk:claude-pr-review`      | Review an open PR from an independent session and post findings to it                                                  |
| `aitk:claude-address-review` | Address PR findings and CI status, refresh stale docs, then push a follow-up                                           |
| `aitk:claude-tasks`          | Add a task to `.claude/tasks/` or archive a shipped one out of the folder                                              |
| `aitk:claude-docs`           | When decisions diverged from plan, update `.claude/` docs                                                              |
| `aitk:claude-ui-test`        | After UI changes, generate and run e2e tests + visual checklist                                                        |
| `aitk:claude-ux-audit`       | Audit existing UI surfaces for missing states, edge cases, inconsistencies                                             |
| `aitk:claude-autoship`       | After plan approval, chain implement → verify → review → draft PR                                                      |
| `aitk:systematic-debugging`  | When a test fails or bug surfaces, enforce root-cause investigation before fixes                                       |
| `aitk:git-ship`              | Post-feature: sync docs, commit, rename branch, open PR                                                                |

## Feedback routing

```plaintext
verify fails  → Session 1 (it has implementation context)
design fails  → new Claude chat session (planning problem)
review finds  → Session 2 (fix alongside review, before ship)
```

## Snippets

For the full list of snippets that complement this workflow, see `.claude/context/snippets.md`.
