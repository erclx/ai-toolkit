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

Carry the arguments the arm needs. A skill guarding on a missing argument answers the bare form with its own refusal and never reaches the behavior under test, so every assertion fails against a skill that is working correctly. `claude:intake/file` states its invocation on the scenario's own `Action:` line and returns the no-dump refusal without it, failing nine assertions bare and passing fifteen with the documented prompt. Read the `Action:` line before composing the prompt, since it is where an arm records what it expects to be handed. A caller following `aitk-sandbox-check`, which fixes the prompt at `/aitk:<skill-name>` with no arguments, hits this on any such arm and should report the mismatch rather than reading it as a defect in the skill.

A sandbox session resolves `aitk` off the machine's PATH, and the harness manages neither the binary nor the variable. An arm exercising a verb the branch adds therefore runs against whatever is installed globally, and a released binary predating the verb produces a session that refuses and writes nothing, failing every assertion for a reason the arm is not about. The `claude:teach` arms met a global install at `0.98.0` carrying no `teach` command at all, against a repository at `0.102.0`. Put the branch's own CLI ahead on PATH for that one run rather than reading the failure as a defect in the skill, and never repair it by installing over the operator's global.

The JSON envelope carries `is_error`, `result`, `num_turns`, and `total_cost_usd`, plus a `verdict` object holding `state`, `asserted`, `failed`, and `unchecked`. Override the model, allowed tools, turn cap, or permission mode with `AITK_SKILL_TEST_MODEL`, `AITK_SKILL_TEST_TOOLS`, `AITK_SKILL_TEST_MAX_TURNS`, and `AITK_SKILL_TEST_PERMISSION_MODE`.

The envelope alone decides nothing. An arm can return `error=false` having written nothing and meeting none of its scenario's stated expectations, so a suite scoring on the envelope would count it as a pass. `run.sh` snapshots the tree before the session, diffs it after, and hands the result to `aitk sandbox check`, whose exit code becomes the run's outcome.

### One tree, so runs serialize

The sandbox path resolves to a single tree per machine, so two sessions running arms at once provision over each other. The second session's provisioning lands between the first's session and its verdict, and the first is then scored against a fixture it never staged. Nothing detects it.

The reply half still passes, because the reply comes off the envelope the run produced, while every path, absence, and content assertion reads the tree that replaced it, so the arm reports a mixed verdict that looks like a skill defect rather than a collision. One `claude:migration-standards` run was lost this way on 2026-08-04, reporting five failures against a tree holding another scenario's anchor fixture.

`AITK_SANDBOX_DIR` is the whole fix, pointing a run at a tree of its own under the home directory or the temp root, which is what `assert_sandbox_dir_safe` already admits. Parallel worktrees are the ordinary shape here, so a session running arms while another is open sets it rather than assuming the tree is its own. The `escapes` array reports the same class of interference from the other direction: it names any file that changed under the toolkit roots during the run, so a concurrent session writing shared session scratch at the main root appears there as an escape the sandbox session never made.

### The run record

Every run also lands at `.claude/.tmp/sandbox-runs/<target>-<arm>-<timestamp>.json`, and `run.sh` logs the path on stderr. The file holds what stdout emitted plus a `writes` array. Both are needed to score a run again later: `aitk sandbox check` recovers the tree-based assertions from surviving sandbox state, but `max_turns` reads the envelope and `write_scope` reads the writes list, and the temp files carrying those are deleted at the end of the run.

The record is gitignored scratch with no rotation, one file per run. Writing it is additive and stdout stays the data contract, so a failure to record warns and prints the verdict anyway. What that costs is the turn count, which is recoverable from nowhere else once the run's temp files are deleted, so an arm whose record failed to write cannot have its ceiling calibrated without paying for the run twice. `claude:toolkit-operator/fresh` is declared at the cap for that reason rather than from an observation.

The warning sits on stderr among the framing, where a caller reading the tail of a passing run does not see it. Nothing prunes the folder, which makes it a scratch-lifecycle question rather than an oversight. It belongs with the other scratch catalogs whenever that track settles when a folder's contents expire.

### Turn budget

The default turn cap is 30. A clean `claude/docs` `drift` run takes 29 turns, and a truncated run fails the same assertions as a reasoning miss with nothing to tell them apart, so the global default sits above observed cost.

Declare an arm's ceiling at the default and correct it from an observation. A ceiling under the cap catches truncation the same way an equal one does, since a truncated run reports one turn past the cap and any declaration at or under the cap sits below that number. What a corrected ceiling buys over the default is that it asserts something the runner does not already enforce, which is what `anchor-sweep` carries at 26 against three runs of 16, 17, and 18.

Correct from a cost that holds rather than from one sample of a variable one. A cost holds when the arm's work has a fixed extent, which one observation bounds: `toolkit-operator/unmigrated` took 12 from a single 6-turn run, because the route resolves off one read with nothing to execute behind it. A cost varies when the work follows whatever the run finds, so that arm needs several runs and a ceiling above the widest, which is what `anchor-sweep` carries.

`migration-superseded/retired` stays at the default on a single 17-turn pass for that reason, since a proposal-only arm resolves several files against several standards and its count moves with how a run orders those reads. Sample count is the consequence rather than the test, and reading it as the test puts a ceiling on any arm that has been run twice. A ceiling derived from one path through a variable cost trades a ceiling that never fires for one that fires on a correct run.

Never declare a ceiling above the cap. A truncated run reports one turn past the cap, a declaration above the cap is at least that number, and the checker fails an arm only on a count strictly over its ceiling. The turn assertion goes green, only the assertions that were going to fail anyway go red, and the ceiling masks the one failure it exists to catch.

Estimate an arm's cost from what it reads rather than from what it writes. `board-sweep` was projected to need a raised cap because it marks one more outcome and moves one more plan than `drift`, and it came in at 28 against `drift`'s 29. The extra mutations are a few edits, while the turns go to reading the board and reasoning about it, which both arms do once. A projected budget is worth nothing next to one real run.

`AITK_SKILL_TEST_MAX_TURNS` is the only budget. An arm's `max_turns` is a ceiling the checker asserts after the run, and `run.sh` never reads `expect.toml`, so a declaration cannot raise the cap it runs under. An arm needing more than the default truncates.

Raise the default or set the variable per run. A per-arm budget would need `run.sh` to parse the declaration, which nothing has yet asked for.

Dollar cost spreads wider than the turn count, and the range `aitk-sandbox-check` documents covers the cheap half alone. Its gate table rules out `cost` for a single arm on a stated 0.10 to 0.25 dollars, which a proposal-only arm meets and a provisioning one does not: `claude:groundwork` `open` came in at 1.05 dollars on 2026-08-19, roughly five times the top of that range, because the skill session staged a three-package workspace and wrote a three-file track rather than resolving a route off a few reads. Read the documented range as a floor when the arm's skill does the domain work, and keep the gate ruled out either way, since one arm at a dollar is still affordable against the branch it verifies.

## Expectations

An arm declares what a correct run leaves behind in `expect.toml`, beside its numbered stage directories. `aitk sandbox check <category>:<command> [arm]` reads it, asserts against the sandbox tree, and prints a verdict. Run it standalone against an already-provisioned sandbox to iterate without paying for another session.

- `paths`: files that must exist after the run, as an exact path or as a glob
- `absent`: files that must not exist, as an exact path or as a glob
- `content`: array of tables, each a `path` and a `pattern` it must match, the path taking either form
- `write_scope`: globs bounding where the session may write
- `reply`: substrings the run's reply text must carry
- `manual`: prose the checker cannot assert, reported as unchecked
- `max_turns`: turn ceiling, above which the run fails

### Writing an assertion

Patterns use TOML literal strings (`'^- \[x\] done'`) so a regex needs no backslash escaping. The split between mechanical and human-judged is per expectation, not per skill: the `claude/docs` `drift` arm produces both kinds in one run, three the checker asserts and two needing a reader.

Every pattern compiles with `m` and nothing else. An inline `(?i)` is not a flag in this engine, so a pattern carrying one fails to compile rather than matching case-insensitively, and the result names it invalid rather than unmatched. Spell the folding as character classes.

A literal string cannot carry an apostrophe, which is what closes it. A pin over prose spells that character `.` instead, costing one character of precision per apostrophe. Switching to a basic string to escape it would reintroduce the backslash doubling the literal form exists to avoid.

An entry carrying `*` is matched as a glob under all three of `paths`, `absent`, and `content`, and the result names the file that matched rather than the pattern that found it. That is what lets an arm name a file whose name a run derives rather than fixes, where pinning one spelling of the derived name passes vacuously against every other spelling and reads as coverage the arm does not have. It covers both directions: the per-session handoff `claude/orchestrate` must not write, and the numbered lesson `claude/teach` must, where the ordinal is the derivation worth asserting and the slug behind it is not.

A glob matching several files answers with one of them in no fixed order, so an arm asserting content through one seeds a folder holding a single match. A `content` path matching nothing falls back to itself, which keeps the miss reported against the entry as the declaration spells it.

`content` matches positively, so pinning a block from its first line to its last is how an arm asserts that nothing inside it changed. Both `claude/docs` diagram arms do this, one over frontmatter and one over a mermaid body and the paragraphs under it. Anchor the block below any frontmatter a run is allowed to append to, or the append pushes the closing line and fails a correct run.

`reply` reads `result` off the same envelope `max_turns` reads, so it costs nothing new to capture. Entries are plain substrings matched case-sensitively rather than regexes, because the token worth asserting is a path or a command and a regex invites an anchored sentence that goes red on any rewording. An absent envelope skips the assertion, while an envelope carrying an empty reply fails it. Those are different states and collapsing them would turn a gap in the input into a red arm.

A positive `reply` entry is still only as stable as the slot it reads. `claude:orchestrate` was run twice in succession on 2026-08-20 against one unchanged fixture on one unchanged branch, and returned `pass` at 6 asserted and 0 failed, then `fail` at 6 asserted and 1 failed. The entry that moved was `claude-feature`, which reads the skill the board report proposes on its `Next:` line, and that same line is one the arm's own `manual` bucket already records as beyond a string match, since a substring finds the slot and cannot constrain what fills it. Read a single failure on an entry of that shape against a second run before treating it as a regression, and prefer a token the run derives over one it chooses.

Declare only positives. An entry asserting what a run must not have said passes on every reply that phrases the thing differently, which is the vacuous pass `manual` is excluded from the count to prevent. Negatives stay in `manual`.

Every `manual` entry states why it stays there, as a sentence appended to the claim. `Semantic:` marks a claim no string match can carry, and `Unwired:` marks one that needs an input the harness does not yet supply, such as stderr or the tool calls. Without the label the bucket absorbs both, and work with a mechanism waiting for it reads the same as work that will never have one.

### Arms without an agent

Expectations are not agent-only. An `infra` arm invoking the CLI directly declares the same way, minus `max_turns`. No agent drives it, so no envelope is produced and a ceiling would sit permanently skipped rather than assert anything. `infra/wiki` carries one declaration per arm and is the pattern to copy for a CLI scenario.

`src/sandbox/expect.test.ts` builds a tree per assertion kind that violates it and requires a red verdict. A checker exercised only against a correct tree cannot distinguish asserting correctly from asserting nothing, so the negative trees are the point rather than extra coverage.
