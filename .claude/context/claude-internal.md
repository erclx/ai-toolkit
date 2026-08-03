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

| Skill                | Description                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `aitk-claude`        | Load before editing plugin skills, the CLAUDE.md seed, or the Claude context entries                   |
| `aitk-governance`    | Load before editing Cursor rules or stack definitions                                                  |
| `aitk-scripts`       | Load before editing scripts or sandbox scenarios                                                       |
| `aitk-snippets`      | Load before editing snippets                                                                           |
| `aitk-standards`     | Load before editing standards or docs                                                                  |
| `aitk-tooling`       | Load before editing tooling stacks or golden configs                                                   |
| `aitk-sandbox-check` | Audit changed plugin skills for missing sandbox scenario edits, user-invoked via `/aitk-sandbox-check` |

### Requirement coverage

The rule that gates a skill edit globs `.claude/skills/**/REQUIREMENT.md`, so a skill without one leaves that gate binding nothing. Coverage is selective by design. A skill earns a requirement when a reader cannot recover from the body alone both the failures it prevents and the nearest thing it deliberately does not do, which `.claude/standards/skill.md` states. The verdicts were applied 2026-08-03 against the eight bodies as they stood, so a later audit checks a stated claim rather than re-deriving one.

- `aitk-claude` carries one. Its scope spans the plugin tree, the seed, and the context entries with no stated edge, and its claim on the Claude entries contests `aitk-standards`.
- `aitk-scripts` carries one. Its instruction to run a scenario and judge the envelope contradicts the arm rules in `aitk-sandbox-check`, and neither body names the other.
- `aitk-standards` carries one. The `docs/` half of its declared scope gets no guidance of its own, appearing once inside a prose instruction that names `standards/` beside it.
- `aitk-ask` carries none. Its guards, its `## Do not` block, and the bounded escalation ladder state both halves.
- `aitk-governance` carries none. Each bullet names the failure it prevents, and no internal sibling contests the source tree.
- `aitk-sandbox-check` carries none. It is the longest internal body and still its own specification, with four deliberate exclusions under `## Do not`.
- `aitk-snippets` carries none. Placement by invoker and the invocation-cadence test are its two stated exclusions.
- `aitk-tooling` carries none. The `tooling/claude/` exclusion ships with its reason, and the body already reads as a list of observed failures.

Length did not discriminate. The 31-line skill earned one and the 191-line skill did not.

### Sandbox check verification route

`aitk-sandbox-check` maps changed items to scenarios and then verifies one of them. It drives `scripts/sandbox/run.sh` against the `Provisioning:` scenario, deriving the target from the scenario path and the prompt as `/aitk:<skill-name>`, and reports the verdict `run.sh` returns rather than asserting its own.

The arm is the third argument and roughly half the catalog requires it. `manage-sandbox.sh` sets `SANDBOX_SCENARIO` and `AITK_NON_INTERACTIVE` only when it receives an arm, so a multi-arm scenario invoked without one falls through to `select_or_route_scenario` and its picker, which aborts on a missing TTY and blocks on input when one is attached. Either way the run dies before the skill session. Forcing `AITK_NON_INTERACTIVE=1` past it is worse, since the picker then takes the first arm and the verdict names an arm nobody chose. The skill greps the scenario for `select_or_route_scenario` and asks for the arm rather than guessing, matching the question it already asks when a skill maps to no scenario.

The runner is the only path the skill takes on its own. Its interactive counterpart stays with the user, because a session that opens a sandbox terminal holds one a headless caller cannot release. That distinction is why the skill's `## Do not` bans the interactive session and names the runner in the same block. The ban entered before the runner existed and read as covering both, which routed every worker to a human for a step the repository could already run.

Verification stops at one arm per invocation. The `Queued:` list stays a printed command, so an automatic ship-time step cannot turn into a catalog sweep.

An item that ships unverified names one of three gates, `no-mechanism`, `credentials`, or `cost`. The vocabulary exists because the three have different fixes and a single sentence about verification being undone hides which one applied. `credentials` covers the `use_anchor` scenarios off an authenticated machine, `no-mechanism` covers a script mapping with no skill invocation to run, and `cost` is reserved for a sweep rather than a single arm.

## Orchestration

`docs/operating-model.md` owns the two roles and the loop they run, reachable in a target as `aitk docs operating-model`. What this entry adds is the pair of artifacts the toolkit ships to make the handoff mechanical.

| Artifact                          | Author                 | Holds                                                                                     | Lifecycle                                              |
| --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `.claude/tasks/vXX.Y-<slug>.md`   | orchestrator           | One task with its outcomes and a test strategy. Phase labels live here.                   | Gitignored, shared across worktrees, archived on ship. |
| `.claude/plans/feature-<slug>.md` | orchestrator or worker | Files to touch with reasons, optional constraints, risks, answered questions for one task | Gitignored, shared across worktrees, archived on ship. |

Drafting flow: orchestrator writes a task file through `claude-tasks`, runs `claude-feature` to produce a plan carrying the reading list and any constraints, then hands the worker a plan slug. Worker enters a linked worktree, reads the plan, and implements. `claude-docs` moves the plan to `.claude/.tmp/plans-archive/` when the task ships and retargets the task file's `Plan:` line at it. The task itself is archived by `aitk tasks archive`, which the `post-merge` hook calls with the pull request number the merge subject carries, so the board closes without a person naming the file. `claude-tasks` calls the same command for the cases the hook cannot resolve.

The origin invariant is owned by `.claude/standards/tasks.md`. What orchestration adds is that a handoff needs more than an origin, because scope lives in the plan rather than in the task file, so a task can sit on the board plan-less and gains one when it is handed out. See Boundaries in `claude-orchestrate` for the handoff rule and for the boundary that keeps tracked edits out of the main worktree.

Both artifacts are gitignored, which is what limits the board to one orchestrator at a time. A second session reads neither the other's task files nor its archives, so the two write colliding labels and archive each other's plans. `claude-orchestrate` states the constraint and holds the queue-refill sweep that keeps planned, non-conflicting tasks ahead of a free worker. `snippets/claude/orchestrator-resume.md` covers the one moment the model cannot detect on its own, which is a compaction dropping the reasoning behind the board it is about to act on, and `snippets/claude/orchestrator-sweep.md` triggers the queue refill after a batch of merges.

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
