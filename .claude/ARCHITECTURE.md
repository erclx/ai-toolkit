# Architecture

Pattern library for how the toolkit implements its agent-first design principles. Reference this when adding a new CLI surface or a new skill. The principles themselves live in `CLAUDE.md`. This doc covers the concrete patterns that realize them.

## Non-interactive execution

Every CLI command honors `AITK_NON_INTERACTIVE=1`. The flag short-circuits `select_option` and `ask` in `scripts/lib/ui.sh` to return the first option or the default value, so skills and scripts can call any command without a TTY.

- `scripts/lib/ui.sh:56,110` implement the fallback
- `select_or_route_scenario` in `scripts/lib/ui.sh` is the deterministic counterpart for sandbox pickers. It reads `SANDBOX_SCENARIO` and skips `select_option` entirely when set. Agents call `aitk sandbox <cat>:<cmd> <scenario>`, which sets the env var and routes to a specific case arm. Unknown scenario names fail fast via a `*) log_error ...` default arm in each script.
- Sandbox scenarios set both `AITK_NON_INTERACTIVE=1` and `SANDBOX_SCENARIO=<name>` to drive tests deterministically
- New commands that add pickers must test the non-interactive path

## Stdout vs stderr

Structured output goes to stdout. Progress bars, timelines, and status messages go to stderr. This lets callers pipe JSON through wrappers without ANSI noise.

- `log_info`, `log_warn`, `log_error`, `log_step` in `scripts/lib/ui.sh` write to stderr
- `close_timeline` writes to stderr
- Wrapper scripts like `scripts/manage-gov.sh` send their opening timeline to stderr so child command stdout is clean
- `printf` and `echo` for structured output write to stdout with no redirection

## Catalog emitters

Each domain exposes a `list` command that dumps its catalog in human and machine formats. Skills read this at runtime rather than embedding names. When a catalog grows (new rule, new stack, new snippet), skills pick it up automatically.

- `scripts/gov/list.sh` is the reference implementation
- Flags follow a shared pattern: `--stacks`, `--rules`, `--json`, scoped to whatever the domain exposes
- JSON emitted manually in most domains. `claude seeds list` and `claude roles list` use `jq` for safe escaping of multi-line markdown content.
- Frontmatter parsing via `awk` in the script. Avoid sourcing a shared parser until a second domain needs it.

Other domains without `list` yet: prompts. See `.claude/TASKS.md`.

## Composable flags over bespoke stacks

Layer rules onto an existing stack with `--add rule1,rule2` rather than authoring a new stack for every combination. Same principle applies to any future domain with base + extras.

- `scripts/gov/install.sh` parses `--add` into a deduped list before resolving rule files
- Extras are deduplicated against the stack's resolved rules, so `--add` of a rule already in the stack is a no-op
- Missing rules warn but do not abort, matching the existing install behavior

## Skill and CLI separation

Skills detect and decide. CLI holds the logic. A skill reads project context (`package.json`, configs, `.claude/` docs), reads the toolkit catalog via `aitk <domain> list --json`, matches, then shells out. The skill never reimplements install or sync.

- `claude/skills/gov-install/SKILL.md` is the reference
- Skill body describes how to think, not what to pick. No hardcoded rule or stack names.
- Execute with `AITK_NON_INTERACTIVE=1` so the CLI skips prompts
- Claude Code's tool permission dialog is the only confirmation gate

## Source of truth

Rules, stacks, snippets, prompts, and standards are authored in this repo. Target projects consume via install and sync. Never author a rule or snippet in a target project on the fly.

- `aitk gov install` copies from toolkit to target
- `aitk gov sync` updates rules already present in target, never adds new files
- If a skill detects a gap (e.g., no Python rule), it routes back to the toolkit for authoring rather than writing in the target

## UI framing across exec boundaries

`manage-*.sh` dispatchers that hand off via `exec` lose any trap set in the parent, so a parent-opened `┌` block never closes. Each subcommand script under `scripts/<domain>/` owns its own frame: open `┌` and print a title line at the top of `main()`, before any `select_option` or `ask` call. Only open the parent frame in the dispatcher when the picker is needed to resolve the subcommand name, then close it with `└` before `exec`.

- `scripts/manage-tooling.sh` is the reference for conditional parent framing
- `scripts/tooling/{list,ref,sync,create}.sh` each open `┌` and print `│ aitk tooling <subcommand>` at the top of `main()`
- Prompts and `log_*` calls assume a frame is open. Opening the frame early prevents dangling `│` output on error paths.

## Tooling stack exclusions

`tooling/claude/` is storage for the `aitk claude` CLI, not a discoverable tooling stack. `scripts/lib/tooling.sh` centralizes the exclusion list and exposes `list_tooling_stacks` and `is_tooling_stack_excluded`. Any future folder under `tooling/` that is not a real stack routes through the same helper.

- `scripts/lib/tooling.sh` defines `TOOLING_STACK_EXCLUDE`
- `scripts/tooling/{list,ref,sync,create}.sh` consume the helper for discovery and name validation
- Excluded names print a redirect error pointing at the correct CLI and exit 1

## Where patterns live

- Shared bash: `scripts/lib/` (`ui.sh`, `gov.sh`, `inject.sh`, `tooling.sh`)
- Per-domain logic: `scripts/<domain>/*.sh`
- CLI dispatch: `src/cli.ts` via commander to `scripts/manage-*.sh`
- Skills (plugin, for target projects): `claude/skills/`
- Skills (internal, toolkit only): `.claude/skills/`
- Governance rules and stacks: `governance/rules/`, `governance/stacks/`
