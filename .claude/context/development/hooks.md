---
title: Hooks
description: Where shell scripts live, the Claude Code hook families and their stdin guard, and the husky hooks with their POSIX sh constraints
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

`precompact-handoff.sh` is the first hook here on an event carrying no tool, and it is toolkit-only. It registers on `PreCompact` against the `manual` matcher, refuses the first `/compact` of a session with exit 2, and names the `session-map` skill in the stderr text that exit 2 turns into the blocking reason. `.claude/ARCHITECTURE.md` holds why blocking is the channel rather than `additionalContext`. What belongs here is what the script has to do about it.

The matcher is the separator between a manual and an automatic compaction, since the vendor reference documents no event-specific payload field for `PreCompact` and lists only the common ones. The script still reads `trigger` and stops on a present `auto`, which hardens a registration someone widened to `*` without depending on a field that may never arrive, so an absent value carries on rather than disabling the hook everywhere. The `hook_event_name` test ahead of it is what keeps the hook silent under `hooks-guard.test.ts`'s inert payload, which names a tool and no event.

Dedupe writes a marker under `.claude/.tmp/precompact-handoff/` keyed on `session_id`, the way three other hooks here already do, and it is load-bearing rather than a courtesy. The block is how the message arrives, so a hook that never stops blocking refuses every compaction the session will ever take. The first `/compact` asks and the second proceeds, which means a session that ignores the message is not asked twice. That is the intended shape, since the hook asks and does not enforce, and nothing it can read tells it whether a map was written or whether one was worth writing.

That dependence is why the marker write fails open. Both the `mkdir` and the truncation exit 0 rather than block when the project root refuses them, because a hook that blocks without recording the block strands the session on every compaction it will ever take, where failing open costs one handoff nobody was asked for. The three hooks whose markers only dedupe advice can leave that unchecked, and this one cannot. Its test drives the branch off a fixture root at mode `0555`, which reads the same as the writable case in every other respect, so the case goes red under a user the mode does not stop rather than passing for a reason it is not about.

The guard test needed widening to reach this hook at all. Its acting case asserted a verdict on stdout with exit 0 for every hook, which is the shape of a hook that advises rather than one that blocks. `ActingCase` now carries an optional `stream` and `code`, so a hook reaching the session by blocking is asserted on stderr with exit 2. Three further cases sit outside the directory walk, covering an automatic compaction passing through, a manual one blocking once and clearing, and stdout staying empty, since writing the reason there would put it in the debug log while the block itself went unexplained.

### The bare flag repair

`bare-flag-repair.sh` shares the `Bash` matcher and clears `core.bare` when worktree entry has left it set. Git refuses every operation while the flag is on, which puts `post-checkout` and the rest of the husky hooks out of reach, so a tool call is the only event that still fires ahead of the command that would fail. `verify.sh` keeps its own call to the same repair, but a planning or review session reads git constantly and runs the suite never, so the suite alone leaves such a session broken for its whole length.

The hook writes to the shared git config as a side effect of an unrelated `Bash` call, so it announces the repair through `additionalContext` rather than clearing the flag silently. It sources `repair_bare_flag` from `scripts/lib/worktree.sh` rather than restating the predicate, and stubs `log_warn` before the source so the library warning lands in a variable instead of on stdout, where an unframed line corrupts the hook protocol.

The flag read comes first and costs one process, ahead of the payload parse, because every invocation but a handful stops there. That measured at roughly 2ms against 3.6ms for `dev-command-reminder.sh` on the same matcher, so the two stay separate hooks.

### Silencing a hook discards the guarantee it carries

A hook that is the only enforcer of a rule cannot discard its command's output, because the reflexive `>/dev/null 2>&1 || exit 0` makes the documented guarantee false. The task index hook suppressed a regen failure while `standards/tasks.md` promised a missing frontmatter field surfaces on the next edit, and the folder is gitignored so `bun run check` cannot reach it and no gate stage would ever have gone red. Before silencing a hook, name the stage that catches the same failure. Where none exists, capture into a variable, exit 0 on success, and emit the error lines as `additionalContext`.

### Linting the hooks

`check:shell` lints `.claude/hooks/` alongside `scripts/` and `tooling/`. It has to, because the shell stage is gated on any `.sh` change. Linting a narrower set than the gate keys on produces a stage that fires on a hook edit, inspects other directories, and reports a pass that says nothing about the file that triggered it. Keep the glob and the gate pattern in step whenever either moves.

## Husky hooks

- `pre-commit` runs `lint-staged` (prettier, cspell, shfmt, shellcheck on staged files).
- `commit-msg` runs `commitlint` against the conventional commit format.
- `pre-push` runs `bun run check`. After pushing, run `git status`. If files changed, commit the diff as `style(<scope>):` and push again.
- `post-merge` archives the task each merged pull request closed and stays silent otherwise. It is the only trigger that fires after a merge, covered in `.claude/context/claude-plugin/skill-archiving.md`. It reads `ORIG_HEAD..HEAD` rather than the tip, since one pull routinely fast-forwards over several merges and reading `git log -1` would strand every task but the last.
- `post-merge` then runs `aitk records push`, which backs the eight gitignored record folders to a private remote. The call sits last so an unreachable remote delays no archiving, and it fires on every merge rather than on one that closed a task, since a review report and a memory entry both land on runs that close nothing.
- A checkout that never ran the one-time setup answers `no-repository` and reports nothing
- `post-rewrite` delegates to `post-merge` on the `rebase` argument, so a `pull.rebase=true` machine gets the same check. It exits on `amend`, which rewrites nothing on the board.

Husky runs every hook as `sh -e "$hook"`, so the shebang on both is advisory and the file is POSIX sh under errexit whatever it declares. A bare `grep` that matches nothing aborts the hook and prints a husky failure on a clean pull, which is why each test sits inside an `if` condition rather than standing alone. Errexit exempts a condition and nothing else.

`check:shell` globs `*.sh` under `scripts`, `tooling`, and `.claude/hooks`, so no husky hook is linted. That cost nothing while all three were one-liners and now leaves two real scripts uncovered. Run `shellcheck --shell=sh .husky/post-merge .husky/post-rewrite` by hand after editing either.

Git hooks export `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, and `GIT_PREFIX`, and those beat `-C` on any shelled git call, so they have to be stripped. `aitk comments scan src` passed standalone and failed under the pre-push hook, where the inherited `GIT_DIR` made `git -C src ls-tree` resolve against the whole repository and the trend arm returned repo-wide figures for a subtree, output ordinary enough to be worse than an error. It recurred in `src/sync/history.ts` and its fixtures at higher cost: the fixture's `git config user.email` overwrote the real repository's committer identity and the index staged all 785 tracked files as deleted. Route every shelled git call through `gitEnv()`, fixtures included, and prove the guard by exporting `GIT_DIR` and running the suite, since the standalone run passes either way.
