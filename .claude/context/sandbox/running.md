---
title: Running
description: Prerequisites, the command surface, headless skill testing, and the expectation declaration
---

# Running a scenario

## Prerequisites

Nine scenarios push to a real GitHub remote. They need an authenticated `gh` and membership in the org that owns `toolkit-sandbox`, which is private. Everything else runs offline against an empty sandbox.

```bash
gh auth login   # required for any scenario declaring use_anchor
```

Provisioning itself is offline now that the starting tree comes from a fixture, so the first network call is the scenario's own `configure_sandbox_anchor_remote` and the push that follows. No precondition checks `gh auth status`, so a missing credential surfaces as a push failure naming the host rather than as a named precondition error. `GIT_TERMINAL_PROMPT=0` is what keeps that immediate instead of a blocked prompt. Org membership is a real requirement and not an accident of the setup, since HTTPS fixes transport rather than authorization and a contributor outside the org still cannot run the anchor scenarios.

## Running

```bash
aitk sandbox                        # interactive category + command picker
aitk sandbox infra:gov install      # run a specific scenario non-interactively
aitk sandbox reset                  # restore sandbox to baseline
aitk sandbox clean                  # wipe sandbox entirely
```

When a scenario argument is passed, `manage-sandbox.sh` sets `SANDBOX_SCENARIO` and `AITK_NON_INTERACTIVE=1` automatically. Multi-scenario scripts call `select_or_route_scenario` from `lib/ui.sh`, which reads `SANDBOX_SCENARIO` and skips the picker when set.

The `aitk-sandbox-check` skill maps changed plugin skills and changed `scripts/` files on a feature branch to their matching scenarios, so an e2e gap on a script edit surfaces the same way it does on a skill edit.

## Headless skill testing

`scripts/sandbox/run.sh` drives a skill through `claude -p` non-interactively, so a session can test a skill without a human opening an interactive sandbox. It provisions a scenario, invokes the skill from the sandbox tree, and prints the run envelope as JSON on stdout with a framed summary on stderr.

```bash
scripts/sandbox/run.sh <cat:cmd> "<prompt>" [scenario]
scripts/sandbox/run.sh git:commit "/aitk:git-commit"
scripts/sandbox/run.sh claude:feature "/aitk:claude-feature add a widget" small
```

The prompt is the explicit skill invocation. Use the `/aitk:<skill>` form so `--plugin-dir` resolves the skill whether or not the branch changed it. A bare `/<skill>` only resolves for skills the sandbox injects, which is the subset changed on the current branch.

The JSON envelope carries `is_error`, `result`, `num_turns`, and `total_cost_usd`, plus a `verdict` object holding `state`, `asserted`, `failed`, and `unchecked`. Override the model, allowed tools, turn cap, or permission mode with `AITK_SKILL_TEST_MODEL`, `AITK_SKILL_TEST_TOOLS`, `AITK_SKILL_TEST_MAX_TURNS`, and `AITK_SKILL_TEST_PERMISSION_MODE`.

The envelope alone decides nothing. An arm can return `error=false` having written nothing and meeting none of its scenario's stated expectations, so a suite scoring on the envelope would count it as a pass. `run.sh` snapshots the tree before the session, diffs it after, and hands the result to `aitk sandbox check`, whose exit code becomes the run's outcome.

### The run record

Every run also lands at `.claude/.tmp/sandbox-runs/<target>-<arm>-<timestamp>.json`, and `run.sh` logs the path on stderr. The file holds what stdout emitted plus a `writes` array. Both are needed to score a run again later: `aitk sandbox check` recovers the tree-based assertions from surviving sandbox state, but `max_turns` reads the envelope and `write_scope` reads the writes list, and the temp files carrying those are deleted at the end of the run.

The record is gitignored scratch with no rotation, one file per run. Writing it is additive and stdout stays the data contract, so a failure to record warns and prints the verdict anyway. Nothing prunes the folder, which makes it a scratch-lifecycle question rather than an oversight. It belongs with the other scratch catalogs whenever that track settles when a folder's contents expire.

### Turn budget

The default turn cap is 30. A clean `claude/docs` `drift` run takes 29 turns, and a truncated run fails the same assertions as a reasoning miss with nothing to tell them apart, so the global default sits above observed cost.

Set an arm's ceiling equal to the cap rather than under it, which is the relationship `drift` carries at 30 against the default 30. A truncated run reports one turn past its cap, so an equal ceiling still catches truncation, while a lower one fails legitimate runs that land in the gap between the two numbers.

Estimate an arm's cost from what it reads rather than from what it writes. `board-sweep` was projected to need a raised cap because it marks one more outcome and moves one more plan than `drift`, and it came in at 28 against `drift`'s 29. The extra mutations are a few edits, while the turns go to reading the board and reasoning about it, which both arms do once. A projected budget is worth nothing next to one real run, so declare the ceiling at the default and correct it from the first observation.

`AITK_SKILL_TEST_MAX_TURNS` is the only budget. An arm's `max_turns` is a ceiling the checker asserts after the run, and `run.sh` never reads `expect.toml`, so a declaration cannot raise the cap it runs under. An arm needing more than the default truncates, and if its declared ceiling sits above the cap it passes that one assertion while failing the rest. Raise the default or set the variable per run. A per-arm budget would need `run.sh` to parse the declaration, which nothing has yet asked for.

## Expectations

An arm declares what a correct run leaves behind in `expect.toml`, beside its numbered stage directories. `aitk sandbox check <category>:<command> [arm]` reads it, asserts against the sandbox tree, and prints a verdict. Run it standalone against an already-provisioned sandbox to iterate without paying for another session.

- `paths`: files that must exist after the run
- `absent`: files that must not exist
- `content`: array of tables, each a `path` and a `pattern` it must match
- `write_scope`: globs bounding where the session may write
- `reply`: substrings the run's reply text must carry
- `manual`: prose the checker cannot assert, reported as unchecked
- `max_turns`: turn ceiling, above which the run fails

### Writing an assertion

Patterns use TOML literal strings (`'^- \[x\] done'`) so a regex needs no backslash escaping. The split between mechanical and human-judged is per expectation, not per skill: the `claude/docs` `drift` arm produces both kinds in one run, three the checker asserts and two needing a reader.

A literal string cannot carry an apostrophe, which is what closes it. A pin over prose spells that character `.` instead, costing one character of precision per apostrophe. Switching to a basic string to escape it would reintroduce the backslash doubling the literal form exists to avoid.

`content` matches positively, so pinning a block from its first line to its last is how an arm asserts that nothing inside it changed. Both `claude/docs` diagram arms do this, one over frontmatter and one over a mermaid body and the paragraphs under it. Anchor the block below any frontmatter a run is allowed to append to, or the append pushes the closing line and fails a correct run.

`reply` reads `result` off the same envelope `max_turns` reads, so it costs nothing new to capture. Entries are plain substrings matched case-sensitively rather than regexes, because the token worth asserting is a path or a command and a regex invites an anchored sentence that goes red on any rewording. An absent envelope skips the assertion, while an envelope carrying an empty reply fails it. Those are different states and collapsing them would turn a gap in the input into a red arm.

Declare only positives. An entry asserting what a run must not have said passes on every reply that phrases the thing differently, which is the vacuous pass `manual` is excluded from the count to prevent. Negatives stay in `manual`.

Every `manual` entry states why it stays there, as a sentence appended to the claim. `Semantic:` marks a claim no string match can carry, and `Unwired:` marks one that needs an input the harness does not yet supply, such as stderr or the tool calls. Without the label the bucket absorbs both, and work with a mechanism waiting for it reads the same as work that will never have one.

### Arms without an agent

Expectations are not agent-only. An `infra` arm invoking the CLI directly declares the same way, minus `max_turns`. No agent drives it, so no envelope is produced and a ceiling would sit permanently skipped rather than assert anything. `infra/wiki` carries one declaration per arm and is the pattern to copy for a CLI scenario.

`src/sandbox/expect.test.ts` builds a tree per assertion kind that violates it and requires a red verdict. A checker exercised only against a correct tree cannot distinguish asserting correctly from asserting nothing, so the negative trees are the point rather than extra coverage.
