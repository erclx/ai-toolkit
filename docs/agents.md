---
title: Agents
description: CLI catalog and invocation rules for agents
category: Agent surface
---

# Agents

CLI catalog and invocation rules for agents working in this repository.

This doc is an index of what an agent can run and how to run it cleanly from a script. It does not cover domain behavior. Read `CLAUDE.md` for project behaviors and load the matching `.claude/skills/aitk-*` skill when working inside a domain.

## Invocation rules

See `CLAUDE.md` design principles. They apply to every command below.

## Output shape

Every CLI command renders into one of two framed shapes. Data goes to stdout. UI and logs go to stderr. Help output is the exception. It prints to stdout so it can be piped and grepped.

### Data shape (lists, runs, errors)

```plaintext
┌
│ aitk <domain>
│
├ Section
│ ✓ item
│ ✓ item
└
```

Rules:

- `┌` opens the frame on stderr
- `│ aitk <domain>` is the command banner, one per invocation
- `├ Section` headers introduce groups of items. `log_step` produces the blank `│` spacer before each.
- `└` closes the frame on stderr, wired via `trap close_timeline EXIT`
- Errors render as `│ ✗ message` inside the same frame. Never emit a lone error line without a frame.

### Help shape

```plaintext
┌
├ Usage: aitk <domain> [command]
│
│  Commands:
│    ...
└
```

Help skips the banner. The `Usage:` line sits directly on `├`. Help writes to stdout because `--help` is documentation, not runtime UI.

### JSON and `--names` modes

`--json` and `--names` keep stdout clean and machine-readable. The frame still renders on stderr (open, banner, close) so the stream discipline is consistent across modes. Consumers that only read stdout see pure data.

## Command catalog

Full help: `aitk <command> --help`.

### Project-level

| Command                  | Purpose                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `aitk init [path]`       | Bootstrap a project with selected toolkit domains                                              |
| `aitk sync [path]`       | Sync all installed domains in a target project                                                 |
| `aitk sync --check`      | Report toolkit drift without writing (`--json`, `--exit-code`)                                 |
| `aitk sandbox [cat:cmd]` | Run sandbox scenarios (interactive or routed)                                                  |
| `aitk sandbox reset`     | Reset sandbox to baseline                                                                      |
| `aitk sandbox clean`     | Wipe the sandbox                                                                               |
| `aitk sandbox check`     | Score a provisioned sandbox against a scenario expectation (`--json` for the verdict)          |
| `aitk sandbox coverage`  | Report which scenarios declare expectations (`--json`, `--strict`)                             |
| `aitk indexes regen`     | Regenerate `index.md` files from sibling frontmatter                                           |
| `aitk docs [topic]`      | Emit toolkit reference docs (`list`, or a topic by name)                                       |
| `aitk design render`     | Render `.claude/DESIGN.md` tokens to HTML and CSS                                              |
| `aitk slides render`     | Render a `.claude/SLIDES.md` source into a PowerPoint deck                                     |
| `aitk slides list`       | List the available slide layouts (`--json` for the catalog)                                    |
| `aitk feedback`          | Write toolkit feedback from stdin to `.claude/review/`, or open a GitHub issue with `--github` |
| `aitk transcripts <url>` | Fetch a YouTube transcript with metadata frontmatter (needs `yt-dlp`)                          |
| `aitk tasks archive`     | Move a shipped task off the board, clear its ordering row, and regenerate the index            |
| `aitk comments scan`     | Measure comment density by language and comment kind, with a trend recomputed from git         |
| `aitk capture [source]`  | Render HTML capture sources to PNG, toolkit-only and absent from an installed package          |

### Domain commands

Each domain exposes a consistent shape where applicable: `list`, `install`, `sync`, `create`.

| Domain      | Subcommands                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `tooling`   | `list`, `sync`, `ref`, `create`, `verify`, `inject`, `prune-gitignore` |
| `snippets`  | `list`, `install`, `sync`, `create`                                    |
| `standards` | `list`, `install`, `sync`                                              |
| `gov`       | `list`, `install`, `sync`, `build`                                     |
| `claude`    | `init`, `sync`, `seeds list`, `setup [dest]`                           |
| `wiki`      | `init`                                                                 |
| `design`    | `render`                                                               |
| `slides`    | `render`, `list`                                                       |
| `tasks`     | `archive`                                                              |
| `comments`  | `scan`                                                                 |

Common patterns:

- `list --json` → machine-readable catalog on stdout.
- `install <name> <path>` → install a specific entry into a target project.
- `sync <path>` → reapply all installed entries in a target project.
- `create [name]` → scaffold a new authoring entry in this repo.

`aitk gov sync` updates only rules already present under `.claude/rules/` and
never adds new ones. A rule the toolkit does not ship is left alone, which is
how project-authored rules survive. It also removes a stale `.claude/GOV.md`
from the retired build. Use `aitk gov install` to add rules.

`aitk standards sync` matches by filename against `.claude/standards/` and
regenerates that folder's `index.md` on every completed run. It is the one sync
that refuses under `AITK_NON_INTERACTIVE=1` when drift exists, logging a warning
and exiting 0 without writing, because standards are seeds a project edits. Run
it interactively, or use the `claude-seed-sync` skill for a per-section audit
that preserves customizations.

`aitk snippets sync` behaves the same way against `.claude/snippets/`. It
matches by path relative to that directory, so a snippet the toolkit no longer
ships, or one authored directly in the target, is reported and skipped rather
than deleted. It is not preset-aware, so a project that installed `essentials`
does not grow new snippets on a sync. Use `aitk snippets install` to add them.

`aitk gov install` and `aitk snippets install` require their first argument
under `AITK_NON_INTERACTIVE=1`. Both used to fall back to an interactive picker
that resolved to its first option headlessly, so `aitk gov install` with no
stack installed whichever stack sorted first and `aitk snippets install` with no
category installed every category. Each now reports the valid names on stderr
and exits 1. Every documented agent path already passes the argument, including
`aitk init`. The confirm-then-apply prompt after it still resolves to `Yes`
headlessly, so a call that names its stack or category is unchanged.

`aitk gov install` also refuses the toolkit root as a target, matching
`aitk snippets install`. Both resolve the target before anything else, so a path
that does not exist fails rather than being scaffolded.

`aitk gov regen` is the one governance verb that runs against the toolkit root,
because the `.claude/rules/` it writes there is produced output rather than an
operator's working copy. It reads the stack recorded in `internal/governance.toml`,
installs it alongside anything under `internal/rules/`, and clears the
destination first so a rule the record stopped naming disappears. It takes
`--root <path>` and defaults to the toolkit root, prints nothing on success, and
reports the reason on stderr with exit 1 when the record names a stack or rule
that does not resolve. `scripts/core/regen-claude-copies.sh` calls it, and the
Consumed copies stage of `bun run check` asserts the result is committed.

`aitk sync` runs every installed domain sync, then offers to commit the result
and open a pull request. Under `AITK_NON_INTERACTIVE=1` it applies the domain
syncs and then refuses the git workflow, reporting the branch and commit it
would have created and exiting 0. Nothing is staged, committed, or pushed
headlessly. Run it interactively to reach the commit and pull request options.
It also refuses a target whose working tree is dirty, so commit or stash first.

`aitk sync --check` reports drift and writes nothing, so it needs no clean tree
and is safe to run at any time. Each file is classified as `stale` when it still
matches what the toolkit installed, `customized` when the project edited it,
`stranded` when it sits at a path the toolkit no longer installs to, `orphaned`
when the project authored it, or `drifted` when no stamp covers it. Use `--json`
for the machine-readable report and `--exit-code` to fail a CI job. Orphaned
files are excluded from that exit code, since a project-authored rule never
converges. Attribution needs `.claude/aitk.json`, which every install and sync
writes. Without it, every difference reports as `drifted`.

Each domain carries its own toolkit anchor in that file, so syncing one domain
never advances the revision another measures from, and each reports the upstream
commits touching its own source path. The `covers` field names the domains a
target has actually stamped, so a domain that was never stamped is legible
rather than reading as a clean one.

`aitk init` installs up to six core domains and reports each one independently. A
domain that fails does not abort the run, so the command finishes the rest and
exits 1 naming the failures. Passing any flag skips the confirmation prompt,
which is what makes it scriptable. `--stack` defaults to `base`, and the default
does not read as a passed flag, so a bare `aitk init` installs governance and
still prompts. `--skip` takes `wiki`, `standards`, and `governance`, and warns
without aborting on any other value.

`aitk tooling inject` and `aitk tooling prune-gitignore` are the unguarded
primitives beneath `sync`. They apply one stack with no scan and no prompt, and
they deliberately skip the check that rejects `claude`, which is how `aitk
claude` drives its own stack through them. Use `sync` unless you are scripting
provisioning. Both frame their own output, so pass `--nested` when calling from
inside an already-open frame.

### Sandbox scenarios

Scenarios live under `scripts/sandbox/`, one folder per category. `scripts/sandbox/fixtures/` is the exception, holding file content that scenarios stage rather than scenarios of its own, so both pickers filter it out. Route non-interactively with `SANDBOX_SCENARIO`:

```bash
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling
```

Scenario categories: `infra:*` (domain flows), `git:*`, `scaffold:*`. `create` scenarios require interactive input and loop on empty input, so skip them in automated runs.

### Scenario expectations

`aitk sandbox check <category>:<command> [arm]` scores a provisioned sandbox against the arm's `expect.toml`, printing a verdict on stderr and, with `--json`, the same verdict as a record on stdout.

```bash
aitk sandbox check claude:docs drift --json
```

| Flag                | Effect                                                     |
| ------------------- | ---------------------------------------------------------- |
| `--envelope <file>` | Read `is_error`, `num_turns`, denials, and the reply text  |
| `--writes <file>`   | Newline-delimited paths the session wrote, for write scope |
| `--json`            | Emit the verdict record on stdout                          |
| `--strict`          | Exit 1 on `unchecked` instead of 0                         |

The verdict `state` is `pass`, `fail`, or `unchecked`. An arm with no `expect.toml` is `unchecked` and exits 0, so the harness stays usable while expectations roll out. A declaration that exists but asserts nothing is a failure, since an expectation file that asserts nothing passes every run.

Omitting `--writes` or `--envelope` does not silently drop the assertion kinds that need them. Write scope, the turn ceiling, and the reply assertion report as unchecked and appear in the count, so the standalone command cannot claim more coverage than it had. A verdict never reports `pass` with zero assertions.

An envelope that parses but carries no `result` field skips the reply assertion the same way an absent file does. An envelope carrying an empty `result` fails it, since a run that returned no text is a finding rather than a gap in the input.

Exit 0 means `pass` or `unchecked`. Exit 1 means `fail`, or a caller error: a malformed target, or a sandbox that was never provisioned. A missing sandbox reports as an error rather than a failed verdict, because failing every path assertion would read as a skill that did nothing. `--strict` moves `unchecked` to exit 1 for a caller that has finished arming its scenarios.

### Scenario coverage

`aitk sandbox coverage` reports which scenarios declare expectations and which only provision a state. It reads the fixture tree, so it needs no provisioned sandbox and runs nothing.

```bash
aitk sandbox coverage --json
```

| Flag       | Effect                                            |
| ---------- | ------------------------------------------------- |
| `--json`   | Emit the coverage record on stdout                |
| `--strict` | Exit 1 while any scenario declares no expectation |

The record carries every scenario with the arms that declare, plus `totalScenarios`, `armedScenarios`, and `armedArms`. Scenarios and arms count separately, since several arms can share one scenario and dividing one by the other overstates the rollout.

`scripts/sandbox/run.sh` calls this after a headless run and merges the verdict into the envelope it prints. It also writes that merged record to `.claude/.tmp/sandbox-runs/<target>-<arm>-<timestamp>.json` with a `writes` array appended, and logs the path on stderr. Both fields are what a later re-score needs, since `--envelope` and `--writes` read files the run deletes on exit. Stdout carries the same bytes it did before the record existed.

## Docs

`aitk docs` emits the toolkit's own reference docs so an agent in a target project can orient without the toolkit source checked out. The CLI resolves `docs/` and `.claude/context/` from its install root, and which of the two it finds depends on how the CLI was installed. A registry install carries `docs/` alone, since `.claude/` is not published. A clone or a linked worktree carries both.

- `aitk docs list [--json]` lists the downstream catalog: the consumer-facing `docs/` surface plus per-domain narrative from `.claude/context/` when that root is present. Toolkit-internal context entries (`ci`, `development`, `extensions`, `sandbox`) are dropped. From a registry install the context section is absent rather than empty.
- `aitk docs <topic>` prints one doc to stdout, resolved by exact name from `docs/` first, then `.claude/context/`. Any doc the install carries is reachable by name, including the toolkit-internal topics the list omits.

A domain too large for one file splits into `<domain>/` with a generated `index.md`, and both verbs name it by the folder. `aitk docs <domain>` prints that index, which is the catalog routing to the sub-area files, and the listing describes it from the index's `subtitle` where a sibling file supplies `description`. A sibling file wins over a folder of the same name. A folder carrying no `index.md` is absent from both, since a catalog is what makes the sub-areas reachable.

Data prints to stdout and the frame to stderr, so `aitk docs <topic> > out.md` captures clean markdown. With no topic and no verb, `aitk docs` runs `list`. An unknown topic names the available topics on stderr and exits 1.

Only a `---` block opening on the first line counts as frontmatter, so a document body carrying horizontal rules emits whole.

## Indexes

`aitk indexes regen` rewrites `index.md` files from sibling frontmatter. With no positional paths, it walks the current directory. With paths, each resolves by walking up to the nearest indexed ancestor, bounded by `--root`. Duplicates dedupe. The whole-repo walk prunes `.git`, `node_modules`, and anything `.gitignore` covers via `git check-ignore`.

A positional path is not filtered that way, because the walk-up resolves on the filesystem and never consults git. That is the only way to regenerate an index inside a gitignored folder, and it is how `.claude/tasks/` stays current.

| Option          | Behavior                                                         |
| --------------- | ---------------------------------------------------------------- |
| `--dry-run`     | Report which indexes would change without writing                |
| `--json`        | Emit a machine-readable record per index on stdout               |
| `--root <path>` | Walk-up boundary when positional paths are passed (default: CWD) |
| `--no-stage`    | Skip the auto `git add` on modified indexes                      |

Exit codes: `0` clean, `1` frontmatter error or missing index, `2` drift found in `--dry-run`.

When positional paths are passed inside a git repo, modified `index.md` files are staged so lint-staged and Claude `PostToolUse` hooks commit the regenerated catalog. Whole-repo walks never auto-stage, and neither does a path git ignores, since staging one always fails and the warning would fire on every edit.

Skills can parse drift without branching on exit code:

```bash
aitk indexes regen --dry-run --json | jq '.results[] | select(.action == "would-write")'
```

For the system rationale, frontmatter contract, when to adopt, and bootstrap path, see `.claude/context/indexes.md`.

## Tasks

`aitk tasks archive` moves a shipped task from `.claude/tasks/` into `.claude/.tmp/task-archive/`, drops its row from `priority.md`, and regenerates the board index. The three run as one unit, so the attended and unattended callers cannot archive differently.

Name the task by its filename stem, or by the pull request it carries:

```bash
aitk tasks archive v28.1-trigger-escalation
aitk tasks archive --pull-request 673 --json
```

| Option               | Behavior                                                     |
| -------------------- | ------------------------------------------------------------ |
| `--pull-request <n>` | Select the task whose `Pull request:` line names this number |
| `--json`             | Emit a machine-readable record on stdout                     |
| `--root <path>`      | Board root, defaulting to the main worktree                  |

Exit codes: `0` archived, `1` refused. Every gate is a refusal rather than a warning, because `.husky/post-merge` calls this with nobody watching. The `reason` field carries which gate fired: `no-board`, `no-match`, `ambiguous`, `no-outcomes`, `open-outcomes`, or `plan-unswept`.

The board is shared scratch at the main worktree root, so `--root` defaults to the first entry of `git worktree list` rather than the working directory. A linked worktree archives against the same board every other session reads.

Skills branch on the reason rather than on the exit code:

```bash
aitk tasks archive --pull-request 673 --json | jq -r 'if .ok then .task else .reason end'
```

For the board format, the `Pull request:` line, and the archive rules, see `.claude/standards/tasks.md`.

## Capture

`aitk capture [source]` renders HTML capture sources to PNG, which is how a committed documentation image regenerates from its committed source. The source defaults to `assets/`, where a directory expands to every `.html` directly inside it, so adding a capture means dropping a file beside the first one and running the same bare command.

```bash
aitk capture
aitk capture assets/install.html
aitk capture assets --out .claude/review/captures
```

| Option             | Behavior                                          |
| ------------------ | ------------------------------------------------- |
| `--out <dir>`      | Write every PNG here instead of beside its source |
| `--selector <sel>` | Element to capture (default: `.window`)           |

Each source renders at `deviceScaleFactor` 2 with a transparent background, and the success line reports the pixel dimensions the element wrapped to. Size is reported and never asserted. The height of a terminal frame is whatever its text wrapped to at a fixed width, so pinning that number would harden an accident.

What is asserted is the font. The command reads the first family the captured element declares and fails when the browser did not resolve it, because a fallback face rewraps the block and silently changes the output. Sources therefore name a real font rather than relying on `monospace`. A source that cannot render reports its own line and exits 1 without dropping the rest of the batch.

The command is toolkit-only. Its render module holds every browser reference in the toolkit and `files` in `package.json` excludes it, so an installed `aitk` carries the command, reports it as absent on one line, and exits 1. Every other command is unaffected, which is the reason the browser import sits behind a dynamic import rather than at a command's top level.

## Comments

`aitk comments scan [path]` reports comment density for a tree, split by language and by comment kind. It is the only command that parses the target's own source, so its scope stays deliberately narrow: TypeScript and bash, line-oriented, no AST.

```bash
aitk comments scan
aitk comments scan src --json
aitk comments scan --since v0.5.0
```

| Option               | Behavior                                                        |
| -------------------- | --------------------------------------------------------------- |
| `--json`             | Add a machine-readable record on stdout, keeping the frame      |
| `--since <rev>`      | Report the trend from this revision instead of a snapshot alone |
| `--languages <list>` | Comma-separated subset of `ts,sh` (default: both)               |

A line counts as a comment when its first non-whitespace token opens one, which is what keeps a URL in a string literal from reading as a `//` comment without a parser. Density is `commentLines / lines`, reported and never graded. The command produces the number and a rule produces the judgment.

Two exclusions are structural rather than tuning. Heredoc bodies are dropped from both the numerator and the denominator, because a scenario script carrying markdown inside one has `#` opening a heading rather than a comment, which inflated a measured 112 comment lines to 427. Fixture trees are pruned by path segment for the same reason. The line-1 shebang is not a comment, since every script has one and counting it puts a floor under density that reports the file count.

`--since` recomputes each point from git via `ls-tree` and `cat-file --batch`, checking nothing out. No ledger is written or read. Six points spread evenly across the window by default, and the boundary revision is always included so the series keeps the reading it is measured against. This works only because density is a pure function of a tree. Which author or session wrote a comment is not recoverable from git and does not belong here.

The degradation sweep reads its vocabulary from whichever rule publishes a `## Degradation vocabulary` heading, preferring `.claude/rules/` over `governance/rules/`, so one definition serves the toolkit and every target. Discovery anchors on the heading rather than a filename, because a renumbered rule would otherwise empty the vocabulary while the sweep still reported clean. With no such rule the sweep reports **skipped** rather than zero hits, since finding nothing and looking for nothing mean opposite things.

`090-code-comments` is the rule that publishes the list, and it ships on the `base` stack. A project that installs or syncs governance for the first time after that rule landed gets a sweep that previously reported skipped, so hits appear where the command used to stay quiet. Edit the backticked terms in the installed copy to change what that project sweeps for. The sweep matches comment text, so a comment naming a term as an example is a hit, and a hit is a prompt to read the line rather than a verdict on it.

## Runtime catalogs

Use these to discover what's available instead of hardcoding names.

| Command                         | Returns                                      |
| ------------------------------- | -------------------------------------------- |
| `aitk tooling list --json`      | Stacks, extends chain, dep and script counts |
| `aitk snippets list --json`     | Presets and categories with their slugs      |
| `aitk standards list --json`    | Standards docs                               |
| `aitk gov list --json`          | Governance stacks and rule sets              |
| `aitk claude seeds list --json` | Seed doc sources with content                |
| `aitk docs list --json`         | Consumer docs plus per-domain context        |

Every catalog serializes through `JSON.stringify`, so a name carrying a quote
emits valid JSON. `aitk tooling list` and `aitk snippets list` previously built
their output with `printf` and no escaping.

`aitk claude seeds list` reads the same plan `aitk claude init` applies, so the
listing and the install cannot disagree. It now reports
`.claude/context/index.md`, which `init` has always installed and the listing
never named, and it emits the project-level `CLAUDE.md` last rather than first.

## Non-interactive examples

```bash
# Create a new tooling stack
AITK_NON_INTERACTIVE=1 aitk tooling create astro

# Sync a stack into a target project
AITK_NON_INTERACTIVE=1 aitk tooling sync astro /path/to/project

# Install a governance stack (the stack argument is required headlessly)
AITK_NON_INTERACTIVE=1 aitk gov install astro --add 260-shadcn /path/to/project

# Update installed governance rules, dropping a retired .claude/GOV.md
AITK_NON_INTERACTIVE=1 aitk gov sync /path/to/project

# Concatenate installed rules into a paste payload
AITK_NON_INTERACTIVE=1 aitk gov build /path/to/project

# Sync a monorepo subtree, skipping the base layer the repo root already owns
AITK_NON_INTERACTIVE=1 aitk tooling sync vite-react /path/to/repo/frontend --skip base

# Verify a stack end-to-end in a throwaway scaffold
aitk tooling verify vite-react

# Apply one stack without scanning or prompting, for scripted provisioning
aitk tooling inject base /path/to/project
aitk tooling inject base /path/to/project --configs --seeds

# Drop managed gitignore entries a manifest no longer declares
# Prints the number removed on stdout, diagnostics on stderr
aitk tooling prune-gitignore base /path/to/project

# Install a snippet preset
AITK_NON_INTERACTIVE=1 aitk snippets install essentials /path/to/project

# Update snippets already installed, leaving project-authored ones alone
AITK_NON_INTERACTIVE=1 aitk snippets sync /path/to/project

# Report standards drift without applying it, which is what headless does here
AITK_NON_INTERACTIVE=1 aitk standards sync /path/to/project

# Copy every standard into a target, overwriting what is there
AITK_NON_INTERACTIVE=1 aitk standards install /path/to/project

# Bootstrap a project. Any flag suppresses the confirmation prompt
AITK_NON_INTERACTIVE=1 aitk init --stack astro --skip wiki /path/to/project

# Run every domain sync. The git workflow is refused headlessly, so nothing is pushed
AITK_NON_INTERACTIVE=1 aitk sync /path/to/project

# Scaffold .claude/wiki/ with a stub index. The target must already exist
AITK_NON_INTERACTIVE=1 aitk wiki init /path/to/project

# Run a sandbox scenario non-interactively
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling
```

## Related

- `CLAUDE.md`: project behaviors and design principles
- `.claude/skills/aitk-*`: domain-scoped guidance for editing work
- `docs/index.md`: full docs directory
