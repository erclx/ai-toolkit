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
| `aitk sandbox [cat:cmd]` | Run sandbox scenarios (interactive or routed)                                                  |
| `aitk sandbox reset`     | Reset sandbox to baseline                                                                      |
| `aitk sandbox clean`     | Wipe the sandbox                                                                               |
| `aitk indexes regen`     | Regenerate `index.md` files from sibling frontmatter                                           |
| `aitk docs [topic]`      | Emit toolkit reference docs (`list`, or a topic by name)                                       |
| `aitk design render`     | Render `.claude/DESIGN.md` tokens to HTML and CSS                                              |
| `aitk slides render`     | Render a `.claude/SLIDES.md` source into a PowerPoint deck                                     |
| `aitk slides list`       | List the available slide layouts (`--json` for the catalog)                                    |
| `aitk feedback`          | Write toolkit feedback from stdin to `.claude/review/`, or open a GitHub issue with `--github` |
| `aitk transcripts <url>` | Fetch a YouTube transcript with metadata frontmatter (needs `yt-dlp`)                          |

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

`aitk sync` runs every installed domain sync, then offers to commit the result
and open a pull request. Under `AITK_NON_INTERACTIVE=1` it applies the domain
syncs and then refuses the git workflow, reporting the branch and commit it
would have created and exiting 0. Nothing is staged, committed, or pushed
headlessly. Run it interactively to reach the commit and pull request options.
It also refuses a target whose working tree is dirty, so commit or stash first.

`aitk init` installs up to six core domains and reports each one independently. A
domain that fails does not abort the run, so the command finishes the rest and
exits 1 naming the failures. Passing any flag skips the confirmation prompt,
which is what makes it scriptable. `--skip` takes `wiki` and `standards`, and
warns without aborting on any other value.

`aitk tooling inject` and `aitk tooling prune-gitignore` are the unguarded
primitives beneath `sync`. They apply one stack with no scan and no prompt, and
they deliberately skip the check that rejects `claude`, which is how `aitk
claude` drives its own stack through them. Use `sync` unless you are scripting
provisioning. Both frame their own output, so pass `--nested` when calling from
inside an already-open frame.

### Sandbox scenarios

Scenarios live under `scripts/sandbox/`. Route non-interactively with `SANDBOX_SCENARIO`:

```bash
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling
```

Scenario categories: `infra:*` (domain flows), `git:*`, `scaffold:*`. `create` scenarios require interactive input and loop on empty input, so skip them in automated runs.

## Docs

`aitk docs` emits the toolkit's own reference docs so an agent in a target project can orient without the toolkit source checked out. The CLI resolves its bundled `docs/` and `.claude/context/` from its install root.

- `aitk docs list [--json]` lists the downstream catalog: the consumer-facing `docs/` surface plus per-domain narrative from `.claude/context/`. Toolkit-internal context entries (`ci`, `development`, `extensions`, `sandbox`) are dropped.
- `aitk docs <topic>` prints one doc to stdout, resolved by exact name from `docs/` first, then `.claude/context/`. Any doc is reachable by name, including the toolkit-internal topics the list omits.

Data prints to stdout and the frame to stderr, so `aitk docs <topic> > out.md` captures clean markdown. With no topic and no verb, `aitk docs` runs `list`. An unknown topic names the available topics on stderr and exits 1.

Only a `---` block opening on the first line counts as frontmatter, so a document body carrying horizontal rules emits whole.

## Indexes

`aitk indexes regen` rewrites `index.md` files from sibling frontmatter. With no positional paths, it walks the current directory. With paths, each resolves by walking up to the nearest indexed ancestor, bounded by `--root`. Duplicates dedupe. The walker prunes `.git`, `node_modules`, and anything `.gitignore` covers via `git check-ignore`.

| Option          | Behavior                                                         |
| --------------- | ---------------------------------------------------------------- |
| `--dry-run`     | Report which indexes would change without writing                |
| `--json`        | Emit a machine-readable record per index on stdout               |
| `--root <path>` | Walk-up boundary when positional paths are passed (default: CWD) |
| `--no-stage`    | Skip the auto `git add` on modified indexes                      |

Exit codes: `0` clean, `1` frontmatter error or missing index, `2` drift found in `--dry-run`.

When positional paths are passed inside a git repo, modified `index.md` files are staged so lint-staged and Claude `PostToolUse` hooks commit the regenerated catalog. Whole-repo walks never auto-stage.

Skills can parse drift without branching on exit code:

```bash
aitk indexes regen --dry-run --json | jq '.results[] | select(.action == "would-write")'
```

For the system rationale, frontmatter contract, when to adopt, and bootstrap path, see `.claude/context/indexes.md`.

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

# Scaffold wiki/ with a stub index. The target must already exist
AITK_NON_INTERACTIVE=1 aitk wiki init /path/to/project

# Run a sandbox scenario non-interactively
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling
```

## Related

- `CLAUDE.md`: project behaviors and design principles
- `.claude/skills/aitk-*`: domain-scoped guidance for editing work
- `docs/index.md`: full docs directory
