---
title: Hooks
description: Where shell scripts live, the Claude Code hook families and their stdin guard, the three session budget settings the repository records without setting, and the husky hooks with their POSIX sh constraints
---

# Hooks

## Shell scripts

All `.sh` files live under `scripts/`, except Claude Code hooks, which live in `.claude/hooks/`. Do not place shell scripts anywhere else.

## Claude hooks

`.claude/hooks/` holds the toolkit's own Claude Code hooks, wired through `.claude/settings.json`. Six carry the same names as the hooks `aitk claude init` seeds from `tooling/claude/seeds/.claude/hooks/`, covered in `.claude/context/claude-plugin/cli.md`, and four of those are byte-identical to their seeded copies. `scratch-guard.sh` and `standards-audit.sh` are the two that diverge, so a fix to either is owed to its counterpart by hand.

### The stdin guard

Every hook that reads a payload opens with `IFS= read -r -d '' -t 2 input` and exits non-zero with a usage line on an empty payload. Under Claude Code the payload arrives and stdin closes, so the read returns at once and the bound is never paid. An unbounded `cat` instead blocks forever when a caller runs the hook by hand or from a tool call whose stdin is an open socket, which holds the background task open and with it the session. Only `bare-flag-repair.sh` is exempt, and it is exempt because it reads no payload.

`read` rather than `timeout cat`, because macOS ships no `timeout` and a missing one empties every payload and refuses every legitimate call. The obvious descriptor test `[ -t 0 ]` is the wrong one, since it reports false on an open socket, which is where the hang came from. Nothing compares the two hook trees, so a guard landing in one leaves the other broken with every stage still passing. `src/hooks-guard.test.ts` walks both directories rather than a fixed list, asserting per file a bounded refusal, silence on a payload the hook ignores, and the real verdict on one it acts on.

The acting payload is what a mangled read fails. A corrupted payload reaches the same quiet exit as one naming a tool the hook filters out, so a test built on the filtered case passes whatever the read did to the bytes. Each hook therefore carries a payload reaching the branch that does its work, paired with a string only that branch emits, and a hook added without one fails rather than passing on the refusal alone.

The two index hooks run with `aitk` dropped from `PATH`, which pins them to the branch reporting a stale index instead of leaving the assertion to depend on whether the CLI is installed.

### What the audit hook could not read

Both copies of `standards-audit.sh` depend on something outside themselves, and each reports the dependency it failed to resolve rather than exiting clean. A pass on a file nobody checked reads the same as a pass on a file carrying no violation, and the report is what separates them.

Neither copy parses a standard any more. Both read a `markdown audit --json` record, so both reach the defect by the same two routes. Resolving no runner reports that nothing ran, and a record naming an empty shipped ban set reports a check narrowed to what the verb could measure. The verb returns that field either way, and reading the findings beside it alone is what let a narrowed check report a pass. The awk each copy replaced parsed its word list out of a standards file, so an absent standard emptied the list and narrowed the check to the two hardcoded characters with nothing said.

The seed differs from the toolkit copy in what it can resolve rather than in what it reads. It reaches an installed binary alone, since a scaffolded project has no checkout to run the CLI out of, and it names `bun add -g @erclx/aitk` when the machine carries none. A non-zero exit is the blunter alternative and carries more than a PostToolUse event warrants.

`hooks-guard.test.ts` covers all four branches, and each case stubs a runner or withholds one, so the verdict comes from the fixture rather than from whichever build the machine carries.

### The dev command reminder

`dev-command-reminder.sh` is toolkit-only and has no seed counterpart. It fires once per session when a `Bash` command runs `check`, `format`, or `check:install`, and points the agent at this domain. The matcher tests the command string rather than the tool name, because `Bash` is the highest-frequency tool in a session and a loose matcher would add latency to every shell call. It stays silent on `check:types` and `test`, which need no reminder.

The filter, the match, and the session id come out of one `jq` pass, so the hot path costs a single process and the second `jq` runs only when the hook actually fires. Splitting the fields through `@tsv` instead looks equivalent and is not: `@tsv` escapes a newline to a literal `\n`, which puts a backslash where the matcher expects whitespace or end of string, and every multi-line command stops matching. A run with no `session_id` exits rather than sharing one marker file, since per-session dedupe needs a real id.

The `entry` the hook names is guarded on existing, so a path this repository does not carry disables the reminder in silence rather than failing it. That target is `.claude/context/development/index.md`, the catalog naming every sibling, because the gotchas the reminder exists to surface sit in several of them and no one file holds the set.

### The path form hook

`path-form.sh` shares the `Edit|Write|MultiEdit` matcher and hands back the absolute form of a path written from a linked worktree, so a session prefers that form over computing it. `governance/rules/core/015-output.md` keeps the instruction as a self-sufficient fallback rather than a branch the hook replaced, since the hook reaches a project only through `tooling/claude/seeds/` at scaffold time while the rule reaches one through `aitk gov sync`, and a target that synced governance without ever scaffolding through the seed would otherwise read a line naming a source it does not have. It reads the worktree branch off `file_path` itself, a `*/.claude/worktrees/*` segment, rather than shelling out to `git rev-parse`, since that call would answer for whatever directory the hook's own process happens to run in rather than the worktree the write came from. `tasks-index.sh` and `memory-index.sh` already derive their main root the same way, off a path suffix rather than the session. It exits quietly on a path with no such segment and resolves `realpath` on one that has it.

The entrypoint branch of the same rule, bare against a `file://` link, stayed prose rather than moving into this hook. Claude Code's own hook documentation lists `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, and `CLAUDE_PLUGIN_DATA` among the environment a hook subprocess inherits and does not list `CLAUDE_CODE_ENTRYPOINT`, and it documents `OTEL_*` variables as deliberately stripped from every spawned subprocess, so the same curation could apply to a variable it never names as passed through. A live spike inside a running session could not confirm either way, since `.claude/settings.json` loads once at session start and a hook added mid-session never fires until the next one begins.

The companion outcome, reporting a turn that wrote files and named none of them, needs a `Stop` hook. Claude Code documents `Stop` as firing once per turn with no per-tool detail, so it works from `last_assistant_message` or `transcript_path`, and the latter is documented as written asynchronously and may lag the turn it reports on. Nothing in this project has registered a `Stop` hook before, so that gap stayed a `Stop`-only follow-up task rather than shipping here.

### The compaction handoff

`precompact-handoff.sh` is the first hook here on an event carrying no tool, and it is toolkit-only. It registers on `PreCompact` under both matchers, refuses the first `/compact` of a session with exit 2, and names the `session-map` skill in the stderr text that exit 2 turns into the blocking reason. On an automatic compaction it exits 0 and writes to stdout instead. `.claude/ARCHITECTURE.md` holds why each trigger gets the channel it does, and what belongs here is what the script has to do about it.

The matcher separates a manual compaction from an automatic one, since the vendor reference documents no event-specific payload field for `PreCompact` and lists only the common ones. The script reads `trigger` and routes on it rather than trusting the matcher alone, since a registration someone widens to `*` would otherwise send an automatic compaction down the blocking path. An absent value takes the manual path, which is the conservative reading of a payload naming no trigger. The `hook_event_name` test ahead of it is what keeps the hook silent under `hooks-guard.test.ts`'s inert payload, which names a tool and no event.

Dedupe writes a marker under `.claude/.tmp/precompact-handoff/` keyed on `session_id`, the way three other hooks here already do, and it is load-bearing rather than a courtesy on the manual path. The block is how the message arrives there, so a hook that never stops blocking refuses every `/compact` the session will ever take. The first asks and the second proceeds, which means a session that ignores the message is not asked twice. That is the intended shape, since the hook asks and does not enforce, and nothing it can read tells it whether a map was written or whether one was worth writing.

The automatic path reads and writes no marker at all, which is why the branch on `trigger` sits ahead of the marker logic rather than inside it. A compaction the session did not ask for never spends the one refusal a typed `/compact` is owed.

That dependence is why the marker write fails open. Both the `mkdir` and the truncation exit 0 rather than block when the project root refuses them, because a hook that blocks without recording the block strands the session on every compaction it will ever take, where failing open costs one handoff nobody was asked for. The three hooks whose markers only dedupe advice can leave that unchecked, and this one cannot. Its test drives the branch off a fixture root at mode `0555`, which reads the same as the writable case in every other respect, so the case goes red under a user the mode does not stop rather than passing for a reason it is not about.

The guard test needed widening to reach this hook at all. Its acting case asserted a verdict on stdout with exit 0 for every hook, which is the shape of a hook that advises rather than one that blocks. `ActingCase` now carries an optional `stream` and `code`, so a hook reaching the session by blocking is asserted on stderr with exit 2. Five further cases sit outside the directory walk, covering an automatic compaction instructing rather than blocking, the same instruction arriving on a second automatic firing, a payload naming no trigger taking the manual path, a manual compaction blocking once and clearing, and stdout staying empty under a block.

### What the client does with a blocked automatic compaction

Read from the shipped binary at `2.1.251` on 2026-08-31, which is a bun-compiled executable carrying its own source, so `grep -a` over it reads the code rather than a symbol table. The vendor page had been the only source before, and it is wrong about this event in a way that inverted the decision resting on it.

A block does hold on `auto`. The runner passes the trigger as the matcher's match query and returns a `blockedBy` field whenever a hook exits 2, and both compaction paths honour it, the newer one returning `hookBlocked` and the older one throwing an error its caller converts to a `hook_blocked` outcome. Neither errors out, so the turn carries on with the context it already had.

What the client does not do is tell the session. The newer path writes `blockedBy` to the debug log and returns. The older path calls its shared notifier as `bFt(Ee, O, {suppressNotification: y})`, where `y` is the auto flag, so the warning is suppressed for exactly this trigger, and it then throws an error whose text the auto caller matches on its prefix and drops. Exit-2 stderr becoming a blocking reason the model reads is a property of the manual path, where the throw reaches the command that renders it.

Exit-0 stdout is the channel that is open. The runner collects the output of every hook that succeeded without blocking into `newCustomInstructions`, and each path merges that into the instructions the summarizer is given: the newer path passes it to its summarize call and the older one joins it with `SFt(d, Ee.newCustomInstructions)`, a plain newline concatenation rather than a replacement. That holds on both triggers. It is per invocation rather than accumulated, since the runner builds the list from the results of that single call and nothing outside it keeps them.

A count is the wrong bound on this trigger, and the reasoning is worth keeping because the obvious design is to reach for one. A precompute pass runs the same hook ahead of the real compaction with a payload identical to it, and every field is common to both, so nothing in it separates the two. When that pass is refused it removes its own record rather than marking it failed, which frees the slot and lets it arm again on the next turn with no backoff.

Anything counted per session is therefore drained by firings the session never sees, and a block bounded that way is spent before the compaction it was written for. Elapsed time fails for a nearer reason, since the precompute arms ahead of the threshold and any window it opens covers the firing that matters. Moving to exit-0 retired the question rather than answering it, because nothing on the automatic path now needs bounding.

### What the driven run showed

The reading above is static and a driven run confirmed all of it. It ran in a scratch project outside this checkout, since a fixture under this root inherits this project's instruction file through the ancestor chain, with a probe hook registered on `auto` that logged every firing, refused the first with exit 2, and wrote an instruction to stdout on every later one. `CLAUDE_CODE_AUTO_COMPACT_WINDOW` is what makes such a run affordable, since it takes an absolute token count and the client clamps it to the range 100K to 1M, so 100K is the smallest window a session can be driven across. A session was then fed unique high-entropy files a turn at a time until it crossed.

The hook fired on `auto` and the refusal held, logged as `Reactive compact blocked by PreCompact hook`. Four seconds later the same session fired the hook again, and by then the marker was written, so the compaction ran and completed at 81,057 tokens down to 1,928. The block bought four seconds and one retry.

Nothing reached the session. Neither the blocking reason nor any notice of it appears anywhere in that session's transcript, which is the static reading confirmed from the outside: the client suppresses the notification on this trigger and drops the text.

The immediate retry is the second way a per-session count is spent, alongside the precompute drain, and it is the one that fired here. The run logged no precompute line at all, which says that pass did not run rather than that it is unavailable, since its own gate is a rollout flag this reading cannot see the value of. Either mechanism spends the bound in seconds, so the exit-0 design does not turn on which one a machine has.

Three obstacles sit between a print-mode session and this measurement, and each one reported a clean pass while measuring nothing. A single prompt followed by tool calls bails with `no assistant messages in summarize set` before hooks run, so the run needs a turn per file through `claude -p -c`. Repeated filler text tokenizes far below its byte count, so a fixture built from one repeated sentence peaked at half the window. A project holding no settings file registers no hooks and says so only as `Found 0 total hooks in registry`, which reads the same as a hook that ran and did nothing.

The operator's own `autoCompactWindow`, recorded further down this entry, is a lever this hook is not and does not reach. It decides whether a compaction happens at all, where the hook decides only what the summarizer is told when one does. A reader treating the hook as the only lever has the wrong half.

### The bare flag repair

`bare-flag-repair.sh` shares the `Bash` matcher and clears `core.bare` when worktree entry has left it set. Git refuses every operation while the flag is on, which puts `post-checkout` and the rest of the husky hooks out of reach, so a tool call is the only event that still fires ahead of the command that would fail. `verify.sh` keeps its own call to the same repair, but a planning or review session reads git constantly and runs the suite never, so the suite alone leaves such a session broken for its whole length.

The hook writes to the shared git config as a side effect of an unrelated `Bash` call, so it announces the repair through `additionalContext` rather than clearing the flag silently. It sources `repair_bare_flag` from `scripts/lib/worktree.sh` rather than restating the predicate, and stubs `log_warn` before the source so the library warning lands in a variable instead of on stdout, where an unframed line corrupts the hook protocol.

The flag read comes first and costs one process, ahead of the payload parse, because every invocation but a handful stops there. That measured at roughly 2ms against 3.6ms for `dev-command-reminder.sh` on the same matcher, so the two stay separate hooks.

### Silencing a hook discards the guarantee it carries

A hook that is the only enforcer of a rule cannot discard its command's output, because the reflexive `>/dev/null 2>&1 || exit 0` makes the documented guarantee false. The task index hook suppressed a regen failure while `standards/tasks.md` promised a missing frontmatter field surfaces on the next edit, and the folder is gitignored so `bun run check` cannot reach it and no gate stage would ever have gone red. Before silencing a hook, name the stage that catches the same failure. Where none exists, capture into a variable, exit 0 on success, and emit the error lines as `additionalContext`.

### Linting the hooks

`check:shell` lints `.claude/hooks/` alongside `scripts/` and `tooling/`. It has to, because the shell stage is gated on any `.sh` change. Linting a narrower set than the gate keys on produces a stage that fires on a hook edit, inspects other directories, and reports a pass that says nothing about the file that triggered it. Keep the glob and the gate pattern in step whenever either moves.

## Session budget settings

Three Claude Code settings bound what a long session costs, and they sit in this entry because `.claude/settings.json` is the same file the hooks above register in. This repository sets none of them, and `tooling/claude/seeds/.claude/settings.json` sets none of them either. Two are live in the operator's own `~/.claude/settings.json` and the third is deliberately unset, so this section is the only place the repository says so. A session reading the settings file alone would conclude all three are unconfigured and set them again, possibly to a different value.

`governance/rules/claude/576-settings.md` routes that session here, since JSON carries no pointer of its own. The rule globs `.claude/settings.json` and the seed copy at `tooling/claude/seeds/.claude/settings.json`, so editing either loads the two facts that hold in any project, being the `autoContinueAtUsageLimit` inversion and the `autoCompactWindow` cap, and a third bullet sending the reader to whatever development record their own project keeps. It names no path. A rule reaches a target through `aitk gov sync` while this entry never leaves the repository, so a citation to this file would resolve for nobody holding the rule, which is the repair `575-hooks.md` already took.

Every value quoted below was read on 2026-08-28 from `https://code.claude.com/docs/en/settings-reference`, `https://code.claude.com/docs/en/model-config`, `https://code.claude.com/docs/en/cross-session-messaging`, and `https://code.claude.com/docs/en/costs`. A local search ahead of that reading concluded neither of the operator's two asks was reachable and was wrong on both, so read the vendor pages before deciding a knob does not exist.

### autoCompactWindow

The setting fixes how full the context window gets before Claude Code compacts. It takes an absolute token count from 100K to 1M rather than a percentage, accepting a plain integer, a `k` or `M` suffix, or a bare number from 100 to 1000 read as thousands. Its documented scope is any settings file. Left unset, a session compacts at its model's context limit, and `/autocompact <value>` writes a value to the user file rather than to the project one.

The operator set 750000 on 2026-08-27, converting an ask phrased as 20 to 30 percent of remaining context into the form the setting takes. The model decides what that number does. Claude Code caps the window at the model's own context window, so a 200K session reaches the cap first and the setting changes nothing there, and the value bites only on a session running the 1M window.

The value stays in the user file rather than moving here or into the seed. A threshold that suits an orchestrator open all day is wrong for a session that opens for ten minutes, which makes it a per-operator preference rather than a project fact, and committing one machine's answer here would impose it on everyone who opens the repository.

### autoContinueAtUsageLimit

The setting makes a session wait in place and continue its task after a claude.ai usage limit resets, instead of losing where it was. The operator set it to `true` on 2026-08-27 and it is live in their user file.

The project file cannot assert it. Its documented scope is user or managed, and the precedence page carves out one direction for this key alone: while a repository file sets it and no user, `--settings`, or managed value does, Claude Code reads the setting as off. Writing `true` into `.claude/settings.json` would therefore turn the behavior off for anyone carrying no value of their own, which inverts what the line appears to do.

The setting also inverts the ask it came from. Stopping a session at 90 percent of a rolling window gives up a tenth of every window to avoid an outcome the setting already makes survivable. That rolling five-hour limit is not readable locally either, and the search for it is closed rather than open: there is no `claude usage` subcommand, `/usage` is interactive, `stats-cache.json` holds daily counts rather than a rolling window, and nothing under `~/.claude/` names usage, limit, or quota. Do not rebuild that search.

### crossSessionInbound

The setting decides what a session does with a message from one of your other sessions, on an `accept`, `hold`, `refuse` ladder. Claude Code delivers an inbound message as a new turn whenever the receiving session sits idle, and that turn carries the whole context, which is what makes the key a cost lever for a dispatch loop. The vendor's own cost page names `hold` as the way to stop paying it.

This repository leaves it unset, decided on 2026-08-27 and re-affirmed here. `hold` and `refuse` are the two values that bound the cost, and both break the worker handback the orchestrator loop runs on, since a held message reaches nobody until an `accept` later applies and a refused one is dropped outright. `accept` is the third value and bounds nothing. No value on the ladder both saves tokens and keeps the loop working, which is why the lever is recorded and not pulled.

Precedence is the reason to leave the seed alone as well. A project or local value wins over managed, `--settings`, and user values when it is stricter and is ignored when it is not, so a `hold` seeded into a scaffolded target would override that operator's own `accept` rather than yield to it.

## Husky hooks

- `pre-commit` runs `lint-staged` (prettier, cspell, shfmt, shellcheck on staged files).
- `commit-msg` runs `commitlint` against the conventional commit format.
- `pre-push` runs `bun run check`. After pushing, run `git status`. If files changed, commit the diff as `style(<scope>):` and push again.
- `post-merge` archives the task each merged pull request closed and stays silent otherwise. It is the only trigger that fires after a merge, covered in `.claude/context/claude-plugin/skill-archiving.md`. It reads `ORIG_HEAD..HEAD` rather than the tip, since one pull routinely fast-forwards over several merges and reading `git log -1` would strand every task but the last.
- `post-merge` then runs `aitk records push`, which backs the nine gitignored record folders to a private remote. The call sits last so an unreachable remote delays no archiving, and it fires on every merge rather than on one that closed a task, since a review report and a memory entry both land on runs that close nothing.
- A checkout that never ran the one-time setup answers `no-repository` and reports nothing
- `post-rewrite` delegates to `post-merge` on the `rebase` argument, so a `pull.rebase=true` machine gets the same check. It exits on `amend`, which rewrites nothing on the board.

Husky runs every hook as `sh -e "$hook"`, so the shebang on both is advisory and the file is POSIX sh under errexit whatever it declares. A bare `grep` that matches nothing aborts the hook and prints a husky failure on a clean pull, which is why each test sits inside an `if` condition rather than standing alone. Errexit exempts a condition and nothing else.

`check:shell` globs `*.sh` under `scripts`, `tooling`, and `.claude/hooks`, so no husky hook is linted. That cost nothing while all three were one-liners and now leaves two real scripts uncovered. Run `shellcheck --shell=sh .husky/post-merge .husky/post-rewrite` by hand after editing either.

Git hooks export `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, and `GIT_PREFIX`, and those beat `-C` on any shelled git call, so they have to be stripped. `aitk comments scan src` passed standalone and failed under the pre-push hook, where the inherited `GIT_DIR` made `git -C src ls-tree` resolve against the whole repository and the trend arm returned repo-wide figures for a subtree, output ordinary enough to be worse than an error. It recurred in `src/sync/history.ts` and its fixtures at higher cost: the fixture's `git config user.email` overwrote the real repository's committer identity and the index staged all 785 tracked files as deleted. Route every shelled git call through `gitEnv()`, fixtures included, and prove the guard by exporting `GIT_DIR` and running the suite, since the standalone run passes either way.
