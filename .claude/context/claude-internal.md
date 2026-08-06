---
title: Claude internal
description: Toolkit-only internal skills, the task and plan artifacts that coordinate sessions, and plugin discovery for local sessions
---

# Claude internal

## Overview

Owns the Claude surfaces that never leave this repo: the `aitk-*` internal skills under `.claude/skills/`, the orchestrator and worker artifacts that coordinate multi-session work, and how a local session loads the plugin. What ships to target projects lives in `.claude/context/claude-plugin/`.

## Layout

- `.claude/skills/` owns the internal `aitk-*` skills, loaded before editing a toolkit domain and never installed into a target

## Internal skills

Internal skills live in `.claude/skills/` and are toolkit-only. They are not installed into target projects.

| Skill                | Description                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `aitk-claude`        | Load before editing plugin skills, the CLAUDE.md seed, or the Claude context entries                        |
| `aitk-governance`    | Load before editing Cursor rules or stack definitions                                                       |
| `aitk-scripts`       | Load before editing scripts or sandbox scenarios                                                            |
| `aitk-snippets`      | Load before editing snippets                                                                                |
| `aitk-standards`     | Load before editing standards or docs                                                                       |
| `aitk-tooling`       | Load before editing tooling stacks or golden configs                                                        |
| `aitk-sandbox-check` | Audit changed skills and scripts for missing sandbox scenario edits, user-invoked via `/aitk-sandbox-check` |

### Requirement coverage

All eight internal skills carry a `REQUIREMENT.md`. Coverage is universal rather than selective, because the operator reads the corpus to decide whether a skill should exist at all, and a file present for some skills and absent for others cannot be scanned for that. An absence reads as a gap in the authoring rather than as a verdict that the body is already its own specification.

The earlier test earned a skill one only when a reader could not recover from the body alone both the failures it prevents and the nearest thing it deliberately does not do. That still describes what a working requirement answers, and it no longer decides which skills get one. Length never discriminated either way, since the 31-line skill earned one under it and the 191-line skill did not.

The rule gating a skill edit globs `.claude/skills/**/REQUIREMENT.md`, so it now fires on every internal skill edit rather than on three of eight. That increase in what a session reads before editing is the accepted cost of the corpus being readable as a set.

The plugin corpus under `claude/skills/` reached the same coverage across three batches, and `.claude/standards/skill.md` now calls the file required for both corpora. A skill whose scope a branch in flight is changing takes its requirement from that branch, so the last of the coverage closes as those branches land rather than ahead of them.

### Sandbox check verification route

`aitk-sandbox-check` maps changed items to scenarios and then verifies one of them. It drives `scripts/sandbox/run.sh` against the `Provisioning:` scenario, deriving the target from the scenario path and the prompt as `/aitk:<skill-name>`, and reports the verdict `run.sh` returns rather than asserting its own.

The arm is the third argument and roughly half the catalog requires it. `manage-sandbox.sh` sets `SANDBOX_SCENARIO` and `AITK_NON_INTERACTIVE` only when it receives an arm, so a multi-arm scenario invoked without one falls through to `select_or_route_scenario` and its picker, which aborts on a missing TTY and blocks on input when one is attached. Either way the run dies before the skill session. Forcing `AITK_NON_INTERACTIVE=1` past it is worse, since the picker then takes the first arm and the verdict names an arm nobody chose. The skill greps the scenario for `select_or_route_scenario` and asks for the arm rather than guessing. The census read that narrowed the pairing prompt does not reach this one, because a census of skills names no arm.

The runner is the only path the skill takes on its own. Its interactive counterpart stays with the user, because a session that opens a sandbox terminal holds one a headless caller cannot release. That distinction is why the skill's `## Do not` bans the interactive session and names the runner in the same block. The ban entered before the runner existed and read as covering both, which routed every worker to a human for a step the repository could already run.

Verification stops at one arm per invocation. The `Queued:` list stays a printed command, so an automatic ship-time step cannot turn into a catalog sweep.

The collection commands the skill spells out do not run as written from where it is invoked. Its Guards and Step 1 both carry `git diff "$(git merge-base main HEAD)" --name-only -- <globs>`, and the worktree isolation guard refuses any Bash command it cannot statically verify stays inside the worktree, which covers a command substitution standing in for a git argument and a braced compound joined by a pipe. Autoship reaches this skill only from a linked worktree, so the literal is refused on every ship-time invocation. Resolve the merge base in a prior plain command and pass the resulting sha.

An item that ships unverified names one of three gates, `no-mechanism`, `credentials`, or `cost`. The vocabulary exists because the three have different fixes and a single sentence about verification being undone hides which one applied. `credentials` covers the `use_anchor` scenarios off an authenticated machine, `no-mechanism` covers a script mapping with no skill invocation to run, and `cost` is reserved for a sweep rather than a single arm.

## Orchestration

`docs/operating-model.md` owns the two roles and the loop they run, reachable in a target as `aitk docs operating-model`. What this entry adds is the pair of artifacts the toolkit ships to make the handoff mechanical.

| Artifact                          | Author                 | Holds                                                                                     | Lifecycle                                              |
| --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `.claude/tasks/vXX.Y-<slug>.md`   | orchestrator           | One task with its outcomes and a test strategy. Phase labels live here.                   | Gitignored, shared across worktrees, archived on ship. |
| `.claude/plans/feature-<slug>.md` | orchestrator or worker | Files to touch with reasons, optional constraints, risks, answered questions for one task | Gitignored, shared across worktrees, archived on ship. |

### The drafting flow

Drafting flow: orchestrator writes a task file through `claude-tasks`, runs `claude-feature` to produce a plan carrying the reading list and any constraints, then hands the worker a plan slug. Worker enters a linked worktree, reads the plan, and implements. `claude-docs` moves the plan to `.claude/plans-archive/` when the task ships and retargets the task file's `Plan:` line at it. The task itself is archived by `aitk tasks archive`, which the `post-merge` hook calls with the pull request number the merge subject carries, so the board closes without a person naming the file. `claude-tasks` calls the same command for the cases the hook cannot resolve.

The origin invariant is owned by `.claude/standards/tasks.md`. What orchestration adds is that a handoff needs more than an origin, because scope lives in the plan rather than in the task file, so a task can sit on the board plan-less and gains one when it is handed out. See Boundaries in `claude-orchestrate` for the handoff rule and for the boundary that keeps tracked edits out of the main worktree.

### Board constraints

Gitignored also means undated. `git log --diff-filter=A` over `.claude/groundwork/`, `.claude/intake/`, `.claude/plans/`, or `.claude/tasks/` returns nothing at all, since no commit ever touched those paths, so a pass reconstructing when a folder opened has only what the file wrote down itself. Filesystem mtime is the wrong substitute, because it records the last edit and reads later than the truth on anything still being worked. A surface that wants a recoverable opening date carries it as a frontmatter field, which is why `.claude/standards/groundwork.md` and `intake.md` both require one.

Both artifacts are gitignored, which is what limits the board to one orchestrator at a time. A second session reads neither the other's task files nor its archives, so the two write colliding labels and archive each other's plans. `claude-orchestrate` states the constraint, holds the queue-refill sweep that keeps planned, non-conflicting tasks ahead of a free worker, and states the method for writing `priority.md` under Writing the board, since the sweep is what promotes and demotes rows and `aitk tasks archive` is the only other writer.

Being gitignored also puts the citations these artifacts carry outside every check. A task file names its origin as a `Groundwork:` or `Plan:` link, `priority.md` carries a plan link per row, and a memory entry names archive paths in its `How to apply:` line. None of those appear in a diff, the citation half of `aitk context audit` covers `.claude/context/` alone, and no drift stage reads the folder, so a path rename anywhere under `.claude/` has to sweep the board and the memory folder by hand or it ships with every pointer broken and each check still green.

### Validating a row

`aitk tasks validate` checks what a row claims once the sweep has rewritten it. It is a verb rather than a hook because the board is gitignored per-machine scratch, so a `PostToolUse` hook would fire on intermediate states mid-restructure and run nowhere but an interactive session. It reads and never writes, since a row is the orchestrator's claim about readiness and a validator repairing one would assert the claim it exists to test. The check it earns its place on is file-set overlap between `## Run now` rows, which is the half of the readiness test a person cannot run by eye.

### Orchestrator runbooks

Five runbooks under `claude/skills/claude-orchestrate/references/` cover the moments the model cannot detect on its own. `orchestrator-sweep.md` triggers the queue refill after a batch of merges, and `orchestrator-parked.md` re-tests a row already parked, on the opposite trigger, per the paragraph below. `orchestrator-poll.md` holds the review trigger and is covered under The review trigger below. `orchestrator-handoff.md` runs memory capture and then writes `.claude/tasks/session.md` before a compaction with what no other artifact carries, and `orchestrator-resume.md` reads it back afterwards alongside the board and the groundwork behind the live work. They ship inside the skill because a runbook the skill cites has to resolve for a project holding the plugin and running no install, and the human fires the two compaction sides by asking for them once the skill is loaded. The routing lives in the body and the skill is user-invoked, so a long session that has dropped the body routes nothing, which is why the body names re-invocation and the two runbook paths as one recovery.

The handoff carries the second recovery, since the body is what a compaction takes and `session.md` is what survives it. Its template closes by naming the resume invocation and the review poll that resume does not restart, and the runbook states the duplication as deliberate so a later pass does not read it as a copy to collapse. Both runbook paths are resolved to absolute form as the file is written, for the reason The review trigger below records about the poll prompt.

Capture sits in the handoff rather than in the sweep because a pass per batch of merges bills the operator a wait while nothing is being built. The sweep reports the debt in its output block and the handoff pays it, which keeps the signal without the wait.

The parked-row pass is separate from the sweep because the two run in opposite directions. All three refill triggers ask what to promote next, so a blocker cell keeps the value it was measured at the day the row was parked, while a merge changes the tree under every parked row at once rather than under the rows naming it. Folding the re-test into the sweep was the alternative and it ties the pass to a merge, when the window it wants is the one where nothing merged and the board is not moving.

The runbook carries the two ways a re-test returns a confident wrong answer rather than an error, which are reading the condition looser than the code consuming it defines the shape, and measuring it against a tree the shipped command does not run against.

### The review trigger

`claude-orchestrate/scripts/poll.sh` reports pull request movement so the orchestrator learns a branch moved without checking by hand. It routes a moved or answered pull request to a narrow re-review and reports an opened one and stops, which automates detection and leaves the judgment where it was. `.claude/groundwork/review-automation/06-decision.md` records why the reviewing half stays manual: a reviewer holding one diff produces neither of the two cross-pull-request findings that justified a reviewer at all.

`orchestrator-poll.md` is a runbook of the kind above and sits with the others, while the script it invokes takes `scripts/` per `.claude/standards/skill.md`, which splits detail from deterministic operations. Placing both on an internal surface was tried first and it strands a target, which installs an orchestrator carrying four runbooks and no review trigger while the skill body names neither the poll nor the script. Nothing catches that. `scripts/core/check-skill-paths.sh` bans a single pattern, `wiki/`, so a skill citing a toolkit-only path passes it clean, and the placement rule holds only while a session applies the reasoning. The start and stop condition is unenforced the same way, and both halves belong to whoever holds the loop, since a session holding a recurring-prompt scheduler starts and cancels one without the operator.

The runbook cites the script as `${CLAUDE_SKILL_DIR}/scripts/poll.sh` and the loop prompt it carries cannot. That variable expands while a skill body renders, and a recurring-prompt invocation arrives as a standalone turn where it reaches the session as a literal string, so the prompt block carries a placeholder the operator substitutes. The runbook states the requirement as a recurring prompt at roughly three minutes and gives `/loop 3m` as one example, since naming a single client's command dates a file that ships to every target holding the plugin. `.claude/context/claude-plugin/distribution.md` measured which variables survive.

Shipping the script makes it the only executable in the plugin, so the three shell stages had to reach a tree that had never held one. `check:shell` globs `claude` alongside `scripts`, `tooling`, and `.claude/hooks`, and both shfmt stages behind `format` and `check:format` glob it too. Adding it to one and not the others leaves the file linted and never formatted, which fails nothing until its next edit drifts. `.claude/context/claude-plugin/distribution.md` carries what else that first executable changes.

The script is tracked and its baseline is not. State lives at `.claude/.tmp/pr-poll/baseline.txt` under the main worktree root, resolved through `git worktree list` rather than through the script's own folder, so a poll started from a linked worktree reads what one started from main wrote. Delete a copy left at `.claude/.tmp/pr-poll/poll.sh` on any machine that ran the poll before it was tracked, since that path is gitignored and no change here removes it.

### Phase label containment

Phase labels stay inside the task board, in both the filename and the title. They never appear in PR titles or bodies, review comments, issues, commit messages, or git tags. What catches a leak on the way out is the scan in `.claude/standards/publish.md`, which reads the label rule from `.claude/standards/versioning.md` beside it. See that file for the rules and the why.

## Plugin discovery

Inside the toolkit repository, Claude Code auto-discovers the plugin from `claude/.claude-plugin/plugin.json`. No flag needed.

In other repositories, pass `--plugin-dir` explicitly:

```bash
claude --plugin-dir $TOOLKIT/claude
```

Add shell aliases to avoid typing the flag each time. Set `TOOLKIT` once in `~/.zshrc` and reference it in the `clp` alias:

```zsh
TOOLKIT=~/path/to/toolkit

alias cl='claude'
alias clp='claude --plugin-dir $TOOLKIT/claude'
alias clps='clp --model sonnet'
```

For the full alias set covering resume, continue, worktree, and model shortcuts, see `docs/zshrc-aliases.md`.

Machine provisioning is a separate concern reachable by the same word. `aitk claude setup` installs user-level Claude config at `~/.claude/` and is covered in `.claude/context/claude-plugin/cli.md`.
