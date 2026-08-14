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

The arm is the third argument and roughly half the catalog requires it. `manage-sandbox.sh` sets `SANDBOX_SCENARIO` and `AITK_NON_INTERACTIVE` only when it receives an arm, so a multi-arm scenario invoked without one falls through to `select_or_route_scenario` and its picker, which aborts on a missing TTY and blocks on input when one is attached. Either way the run dies before the skill session.

Forcing `AITK_NON_INTERACTIVE=1` past it is worse, since the picker then takes the first arm and the verdict names an arm nobody chose. The skill greps the scenario for `select_or_route_scenario` and asks for the arm rather than guessing. The census read that narrowed the pairing prompt does not reach this one, because a census of skills names no arm.

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

Drafting flow: orchestrator writes a task file through `claude-tasks`, runs `claude-feature` to produce a plan carrying the reading list and any constraints, then hands the worker a plan slug. Worker enters a linked worktree, reads the plan, and implements.

`claude-docs` moves the plan to `.claude/plans-archive/` when the task ships and retargets the task file's `Plan:` line at it. The task itself is archived by `aitk tasks archive`, which the `post-merge` hook calls with the pull request number the merge subject carries, so the board closes without a person naming the file. `claude-tasks` calls the same command for the cases the hook cannot resolve.

The origin invariant is owned by `.claude/standards/tasks.md`. What orchestration adds is that a handoff needs more than an origin, because scope lives in the plan rather than in the task file, so a task can sit on the board plan-less and gains one when it is handed out. See Boundaries in `claude-orchestrate` for the handoff rule and for the boundary that keeps tracked edits out of the main worktree.

### Board constraints

Gitignored also means undated. `git log --diff-filter=A` over `.claude/groundwork/`, `.claude/intake/`, `.claude/plans/`, or `.claude/tasks/` returns nothing at all, since no commit ever touched those paths, so a pass reconstructing when a folder opened has only what the file wrote down itself. Filesystem mtime is the wrong substitute, because it records the last edit and reads later than the truth on anything still being worked. A surface that wants a recoverable opening date carries it as a frontmatter field, which is why `.claude/standards/groundwork.md` and `intake.md` both require one.

Both artifacts are gitignored, which is what limits the board to one orchestrator at a time. A second session reads neither the other's task files nor its archives, so the two write colliding labels and archive each other's plans. `claude-orchestrate` states the constraint, holds the queue-refill sweep that keeps planned, non-conflicting tasks ahead of a free worker, and states the method for writing `priority.md` under Writing the board, since the sweep is what promotes and demotes rows and `aitk tasks archive` is the only other writer.

Being gitignored also puts the citations these artifacts carry outside every check. A task file names its origin as a `Groundwork:` or `Plan:` link, `priority.md` carries a plan link per row, and a memory entry names archive paths in its `How to apply:` line. None of those appear in a diff, the citation half of `aitk context audit` covers `.claude/context/` alone, and no drift stage reads the folder, so a path rename anywhere under `.claude/` has to sweep the board and the memory folder by hand or it ships with every pointer broken and each check still green.

### Validating a row

`aitk tasks validate` checks what a row claims once the sweep has rewritten it. It is a verb rather than a hook because the board is gitignored per-machine scratch, so a `PostToolUse` hook would fire on intermediate states mid-restructure and run nowhere but an interactive session. It reads and never writes, since a row is the orchestrator's claim about readiness and a validator repairing one would assert the claim it exists to test.

The check it earns its place on is file-set overlap between `## Run now` rows. That group's test has a plan half and a half asking whether the task carries a reason it cannot start, and a collision against what something already running touches is one such reason, which is the part a person cannot run by eye.

### Orchestrator runbooks

Five runbooks under `claude/skills/claude-orchestrate/references/` cover the moments the model cannot detect on its own. `orchestrator-sweep.md` triggers the queue refill after a batch of merges, and `orchestrator-parked.md` re-tests a row already parked, on the opposite trigger, per the paragraph below. `orchestrator-poll.md` holds the review trigger and is covered under The review trigger below.

`orchestrator-handoff.md` covers the write side of a compaction and `orchestrator-resume.md` the read side, both over the session map `.claude/standards/session.md` governs. The standard holds what any session can fill, which is the three core sections, the per-session filename, the capture and drift steps that open the write, and the citation rule. The runbook holds what the role adds over it: the section for decisions taken under delegated authority, the closing block that restarts the review poll, and the instruction telling capture this session never commits.

Splitting on role rather than on file is what lets a feature session write a handoff at all. A worker holds no delegation to have exercised and runs no review poll, so lifting the whole runbook would hand it two sections it can only leave blank, and a blank section teaches its reader to skip the file. The drift step went to the standard on the opposite test: the failure it detects follows session length rather than role, so a long worker session writing a handoff while following a body the repository has moved past is the case the step exists for.

The standard sits in the flat `standards/` root rather than in a skill's `references/`, because two skills read it and a skill body may not cite a path inside a sibling skill. The root reaches both callers twice over, through `.claude/standards/` where an install put it and through the corpus the plugin ships beside `skills/`, so a project holding the plugin and running no install still resolves it.

One file per session is what keeps two writers off one path. `session-<slug>.md` takes the branch-derived slug, so two sessions closing near each other write different files and the reader takes the newest by modification time. A declared section ownership over one file was the alternative and it asks two sessions to cooperate on a write neither can watch the other make. The cost is a folder to scan where a known path used to sit, which the newest-wins read absorbs on the common path. `RESERVED_STEMS` in `src/tasks/archive.ts` gained the prefix so neither task verb counts a handoff as a task carrying no row.

The runbooks ship inside the skill because a runbook the skill cites has to resolve for a project holding the plugin and running no install, and the human fires the two compaction sides by asking for them once the skill is loaded. The routing lives in the body and the skill is user-invoked, so a long session that has dropped the body routes nothing, which is why the body names re-invocation and the two runbook paths as one recovery.

The handoff carries the second recovery, since the body is what a compaction takes and the map is what survives it. Its closing block names the resume invocation and the review poll that resume does not restart, and the runbook states the duplication as deliberate so a later pass does not read it as a copy to collapse. Both runbook paths are resolved to absolute form as the file is written, for the reason The review trigger below records about the poll prompt.

`session-resume` reads the newest map ahead of the board and reports it under a `Carried over` slot, which closes the loop for every session that holds no orchestrating role. It reads and never writes, since the write happens at the close of a session and the read at its start, and it names the standard when a session asks how to leave a handoff behind rather than routing that request to a skill of its own. Absence stays silent, because most projects carry no map and a line reporting that every run trains a reader to skip the line on the run where one exists.

The one file per session lands on the board catalog, which filters nothing and gains a row per session that ever wrote a handoff, with nothing pruning them. That is the catalog behaving as a catalog rather than a defect in it, so the filter sits in the reader: `session-resume` drops the `index`, `priority`, and `session-` rows before calling what remains the backlog. Teaching the generator to skip them was the alternative and it breaks the one thing the catalog is for, which is naming every file in the folder.

Capture sits in the handoff rather than in the sweep because a pass per batch of merges bills the operator a wait while nothing is being built. The sweep reports the debt in its output block and the handoff pays it, which keeps the signal without the wait.

The parked-row pass is separate from the sweep because the two run in opposite directions. All three refill triggers ask what to promote next, so a blocker cell keeps the value it was measured at the day the row was parked, while a merge changes the tree under every parked row at once rather than under the rows naming it. Folding the re-test into the sweep was the alternative and it ties the pass to a merge, when the window it wants is the one where nothing merged and the board is not moving.

The runbook carries the two ways a re-test returns a confident wrong answer rather than an error, which are reading the condition looser than the code consuming it defines the shape, and measuring it against a tree the shipped command does not run against.

### The review trigger

`claude-orchestrate/scripts/poll.sh` reports pull request movement so the orchestrator learns a branch moved without checking by hand, and the runbook's routing block decides what each report earns. A first pass, a re-review, and the handback dispatch all run from that block, so the operator triggers none of them. What stays fixed is where the pass runs rather than who starts it: `.claude/groundwork/review-automation/06-decision.md` records that it belongs in this warm session, since a reviewer holding one diff produces neither of the two cross-pull-request findings that justified a reviewer at all.

`orchestrator-poll.md` is a runbook of the kind above and sits with the others, while the script it invokes takes `scripts/` per `.claude/standards/skill.md`, which splits detail from deterministic operations. Placing both on an internal surface was tried first and it strands a target, which installs an orchestrator carrying four runbooks and no review trigger while the skill body names neither the poll nor the script.

Nothing catches that. `scripts/core/check-skill-paths.sh` bans a single pattern, `wiki/`, so a skill citing a toolkit-only path passes it clean, and the placement rule holds only while a session applies the reasoning. The start and stop condition is unenforced the same way, and both halves belong to whoever holds the loop, since a session holding a recurring-prompt scheduler starts and cancels one without the operator.

The runbook cites the script as `${CLAUDE_SKILL_DIR}/scripts/poll.sh` and the loop prompt it carries cannot. That variable expands while a skill body renders, and a recurring-prompt invocation arrives as a standalone turn where it reaches the session as a literal string, so the prompt block carries a placeholder the operator substitutes. The runbook states the requirement as a recurring prompt at roughly three minutes and gives `/loop 3m` as one example, since naming a single client's command dates a file that ships to every target holding the plugin. `.claude/context/claude-plugin/distribution.md` measured which variables survive.

Shipping the script makes it the only executable in the plugin, so the three shell stages had to reach a tree that had never held one. `check:shell` globs `claude` alongside `scripts`, `tooling`, and `.claude/hooks`, and both shfmt stages behind `format` and `check:format` glob it too. Adding it to one and not the others leaves the file linted and never formatted, which fails nothing until its next edit drifts. `.claude/context/claude-plugin/distribution.md` carries what else that first executable changes.

The script is tracked and its baseline is not. State lives at `.claude/.tmp/pr-poll/baseline.txt` under the main worktree root, resolved through `git worktree list` rather than through the script's own folder, so a poll started from a linked worktree reads what one started from main wrote. Delete a copy left at `.claude/.tmp/pr-poll/poll.sh` on any machine that ran the poll before it was tracked, since that path is gitignored and no change here removes it.

### The handback dispatch

A posted finding reaches the worker as a message from the reviewing session, which is the one step in the loop where that session already knows what a specific live session should do next. `ListAgents` and `SendMessage` carry it and `wiki/claude/claude-sessions.md` holds the transport, with the relay through a person as the alternative that lost. A trial across the seven pull requests reviewed on 2026-08-13 is what the shipped step encodes rather than what the transport permits.

Three findings shape the rule. Severity is the gate, since a minor posts under the same heading as everything else and dispatching on any open finding sends a worker to act on a note. A session resolves at the moment of sending and never from a stored map, because names rotate and one written down earlier in a session failed inside the hour. A message carries plain text, so the step names a skill for the reader to run rather than embedding an invocation that would arrive as text.

The grade is load-bearing once the dispatch keys on it, and the trial graded it poorly in both directions. A mis-called minor dispatches nobody, so it lands as a defect the operator has to notice rather than as a note in a comment, and a should-fix raised over a decision the plan already declined sends a worker to act on nothing.

The return leg is the part this work was not written to build and is the strongest argument for the channel. A worker answering a posted finding by naming the plan question that had already declined it changed the outcome in the moment, where a thread comment waits on whoever reads it next.

That reply now reaches the pull request rather than two transcripts that both end. The responding skill carries the fact behind a declined finding into the bullet its body already writes, and the reviewing skill states a withdrawal or a regrade with what produced it instead of dropping the finding from its next body. Keying the rule to a finding the body already enumerates is what makes it fire, since a rule asking a session to judge whether its own reply mattered is the judgment that failed four times in one day.

The other class stays off the thread by decision. A correction to what the reviewing session believes, such as which session holds which branch or that a worker's edits pass an approval gate, settles no finding on a pull request that closes, so it takes the route the skill already states for a change found while orchestrating and lands on the task owning that surface. Both halves are prose and no check tests a posted reply for either, so the split holds while a session applies it.

One branch ships untested. Every dispatch in the trial found a live session, so the fallback that reports the invocation for a person rests on reasoning alone.

The runbook holds the routing and the skill body points at it, after a rewrite in a scheduler dropped a case the shipped block covered. Correcting a running loop is a cancel and a re-create rather than an edit, so the runbook now states both directions of the divergence instead of only the one already written down.

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
