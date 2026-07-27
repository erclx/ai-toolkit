---
title: Claude plugin
description: Plugin skills shipped to target projects, the aitk claude CLI, and overlap with built-in Claude Code features
---

# Claude plugin

## Overview

Owns everything the toolkit ships outward under the Claude domain: the plugin skills in `claude/skills/`, the plugin manifest, and the `aitk claude` CLI that seeds `.claude/` and `CLAUDE.md` into a target project. Internal skills that never leave this repo live in `.claude/context/claude-internal.md`.

## Layout

- `claude/skills/` owns the plugin skills, auto-discovered when Claude Code loads with `--plugin-dir`
- `claude/.claude-plugin/` owns `plugin.json`, the plugin manifest

## Plugin skills

Plugin skills live in `claude/skills/` and are auto-discovered when Claude Code loads with `--plugin-dir`. No registration needed, folder presence is enough. Each skill is a kebab-case folder containing `SKILL.md`.

Skills that perform a one-time structural move of an existing project into a newer toolkit layout use the `migration-*` prefix (`migration-claude-md`, `migration-context`, `migration-standards`). Add new one-shot relocations to this family. Recurring reconciliation tools like `claude-seed-sync` are not migrations and stay outside it.

| Skill                    | Description                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `bash-script`            | Generate interactive bash scripts with a visual timeline UI and error handling                   |
| `ci-workflow`            | Generate GitHub Actions CI workflow files with parallel, gated jobs                              |
| `cli-script`             | Generate non-interactive automation and CI bash scripts in a lean functional style               |
| `claude-design-extract`  | Draft `.claude/DESIGN.md` from existing prose and shell UI surfaces                              |
| `claude-design-propose`  | Draft `.claude/DESIGN.md` on day one from REQUIREMENTS.md and a personality paragraph            |
| `claude-diagram`         | Draft `.claude/DIAGRAMS.md` with mermaid diagrams from architecture and code signals             |
| `claude-docs`            | Update .claude/ planning docs to reflect mid-cycle decisions                                     |
| `claude-feature`         | Plan a feature by reading Claude setup and scanning source files                                 |
| `claude-memory-capture`  | Extract durable patterns from the session into `.claude/memory/`                                 |
| `claude-memory-review`   | Review `.claude/memory/` and propose per-entry promote, consolidate, handoff, or delete          |
| `claude-orchestrate`     | Assert the orchestrator role and dispatch the roadmap, feature, review, and worktree skills      |
| `claude-pr-review`       | Review an open PR from an independent session and post findings as a PR comment                  |
| `claude-address-review`  | Pull PR findings and CI status, fix each, refresh stale docs, push a follow-up, and reply        |
| `claude-review`          | Review all changes since main for bugs, edge cases, and logic flaws                              |
| `claude-roadmap`         | Draft or update `.claude/ROADMAP.md` by sequencing MVP scope into ordered versions               |
| `claude-screencast`      | Draft a stack-agnostic screencast script with pre-seeded beats and defaults                      |
| `claude-seed-sync`       | Audit installed seed docs and standards against toolkit sources, write per-part proposals        |
| `claude-slides-draft`    | Draft a `.claude/SLIDES.md` source and render it to PowerPoint via `aitk slides render`          |
| `claude-standards-audit` | Audit changed markdown files against applicable authoring standards, reporting only              |
| `migration-standards`    | Propose `git mv` of root standards/ and snippets/ into .claude/                                  |
| `claude-ui-test`         | Generate and run Playwright e2e tests, with manual checklist for visual-only items               |
| `claude-ux-audit`        | Audit existing UI surfaces for missing states, edge cases, and inconsistencies                   |
| `claude-worktree`        | Enter a worktree at `.claude/worktrees/<name>/` with name derived from plan or branch            |
| `claude-autoship`        | Chain implement → verify → review → ship after a plan is approved                                |
| `migration-claude-md`    | Classify `CLAUDE.md` sections and propose moves to path-scoped rules or context entries          |
| `migration-context`      | Classify `docs/` content and propose `git mv` to `.claude/context/`                              |
| `create-rule`            | Scaffold a project-local governance rule into .claude/rules/                                     |
| `create-skill`           | Create a new skill file in .claude/skills/                                                       |
| `create-snippet`         | Create a new snippet file in snippets/                                                           |
| `create-standard`        | Create a new standard file in standards/ following the meta-standard                             |
| `docs-sync`              | Rewrite stale README.md and docs/\*.md sections since main                                       |
| `git-branch`             | Rename current branch to match conventional format                                               |
| `git-commit`             | Generate a conventional commit message from staged changes                                       |
| `git-followup`           | Stage, commit, push, and sync the open PR, replying when it carries review comments              |
| `git-pr`                 | Generate a PR description and open or update a pull request                                      |
| `git-issue`              | Format a session bug or task and file it on the current repo via `gh issue create`               |
| `git-split`              | Split a mixed-commit branch into focused branches and open PRs                                   |
| `git-stage`              | Batch-commit staged files grouped by concern                                                     |
| `git-worktree`           | List and clean up linked worktrees after shipping                                                |
| `toolkit-cli`            | Reference for what aitk sync and install commands overwrite, merge, or leave untouched           |
| `toolkit-operator`       | Front door that orients on toolkit docs and live catalogs, then runs or routes any operation     |
| `setup-gov`              | Detect project stack from files and install matching governance rules                            |
| `setup-indexes`          | Bootstrap the index.md system in a target project, drafting frontmatter per folder               |
| `setup-init`             | Detect project type and run one-shot `aitk init` with resolved flags                             |
| `setup-plugins`          | Install curated community and official plugins user-scoped via the `claude plugin` CLI           |
| `git-ship`               | Run the full post-feature workflow in one sequence                                               |
| `session-resume`         | Resume from tracked work and relevant context at session start                                   |
| `systematic-debugging`   | Enforce root-cause investigation before fixes when a test fails or a bug surfaces                |
| `toolkit-feedback`       | Format a session-context feedback block and write it to the toolkit repo via `aitk feedback`     |
| `toolkit-triage`         | Triage open GitHub feedback issues, classify each, and route to a direct fix or `claude-feature` |
| `setup-verify`           | Run `package.json` scripts after scaffold to catch config and wiring mistakes                    |
| `youtube-transcripts`    | Fetch a YouTube transcript with metadata frontmatter via `aitk transcripts`                      |

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. Skills marked with `disable-model-invocation: true` (`claude-autoship`, `claude-orchestrate`, `create-skill`, `git-ship`, `toolkit-operator`) require explicit invocation and will not auto-trigger. Git skills (`git-commit`, `git-pr`, `git-branch`, `git-stage`) override built-in commit and PR behavior. See `.claude/standards/skill.md` for authoring conventions.

Plugin skills that shell out to the CLI follow a consistent pattern: read the toolkit catalog via `aitk <domain> list --json`, match against project context, then execute the CLI with `AITK_NON_INTERACTIVE=1` so it skips prompts. Claude Code's tool permission dialog is the single confirmation gate. Skills never reimplement CLI logic or hardcode rule, stack, or snippet names. `setup-gov` is the reference.

## CLI

| Command                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `aitk claude init`       | Seed `.claude/` workflow docs and `CLAUDE.md` into a project |
| `aitk claude seeds list` | List seed doc sources, plain text or `--json` for skills     |
| `aitk claude sync`       | Reconcile `.gitignore` against the claude manifest           |
| `aitk claude setup`      | Install user-level Claude config to `~/.claude/`             |

### init

Seeds `.claude/` with project docs (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `TASKS.md`, `DESIGN.md`, `wireframes/`, `settings.json`) and hook scripts under `.claude/hooks/`. Also seeds `CLAUDE.md` at the project root and merges `.gitignore` entries. Skips files already present. Run once per project. Coding and doc-authoring standards arrive separately via `aitk gov install`, which writes path-scoped rules to `.claude/rules/`.

The `.claude/wireframes/` folder ships with an `index.md` discovery anchor. Add a file per surface as the UI grows, following `.claude/standards/wireframes.md`. Read `index.md` first, then load only the surface files the current task touches. Per-surface files keep the lazy-load model honest as the project grows.

The seed `settings.json` ships three hook blocks. A PostToolUse hook pairs with `.claude/hooks/standards-audit.sh`, which greps markdown files for em-dashes and semicolons banned in `.claude/standards/prose.md`, excludes fenced code blocks, and emits `additionalContext` so the agent self-corrects on the next turn. Scratch dirs `.claude/.tmp/`, `.claude/memory/`, `.claude/review/`, and `.claude/plans/` are skipped. A PreToolUse hook on `Grep` and `Glob` pairs with `.claude/hooks/index-reminder.sh`, which walks up from the search path to the nearest `index.md` and reminds the agent to read it first, once per folder per session. It fires only where an index exists, so it self-scales to a project's index density. A PreToolUse hook on `Write` and `Edit` pairs with `.claude/hooks/scratch-guard.sh`, which fires when a temp-path write lands outside `.claude/.tmp/` and reminds the agent to write scratch there, once per session. It enforces the scratch rule deterministically instead of relying on CLAUDE.md prose the harness scratchpad instruction competes with.

User-level pieces (attribution, permission allows, and `.env` denies) live at `~/.claude/settings.json` and install once per machine via `aitk claude setup`. Project settings layer on top of user settings, so per-project files only need to carry what is genuinely project-specific.

### seeds

`aitk claude seeds list [--json|--names]` enumerates the seed docs that `aitk claude init` would copy into a project. Skills consume `--json` to compare a target project's installed copies against the toolkit's current seed source and propose targeted edits. The CLI only emits content. Reconciliation is the skill's job (see `claude-seed-sync`).

### sync

Reports whether each seeded project doc is present, then reconciles `.gitignore` against the `[gitignore]` section of `tooling/claude/manifest.toml`: appends any missing entries and prunes entries inside the `# Claude` section that the manifest no longer declares. Removed entries are logged as `-` lines. Never touches seeded project docs, so `.gitignore` is the only file it writes.

`aitk sync` invokes this command with `AITK_NON_INTERACTIVE=1` when `.claude/` exists in the target, so gitignore reconciliation lands in the combined toolkit-sync PR alongside other domains. The changed-file tracking in `manage-sync.sh` watches `.gitignore` for this reason. Seed audits are not automated. Run the `claude-seed-sync` skill for per-part reconciliation across the preamble and each `##` section. `aitk sync` prints a tip reminder at the tail.

### setup

Installs user-level Claude Code config from `tooling/claude/user/` into `~/.claude/`. Run once per machine after cloning the toolkit. Idempotent. Re-runs skip blocks that already match.

Three things land:

- `statusline-command.sh` copied to `~/.claude/` and registered as `statusLine.command` in `~/.claude/settings.json`.
- `attribution.commit` and `attribution.pr` set to empty strings to suppress Claude attribution in commits and PRs.
- `permissions.allow` and `permissions.deny` merged from `tooling/claude/user/settings.template.json`. Defaults: `Bash(bun run *)` on allow, and `Read(**/.env)` plus `Read(**/.env.*)` on deny. Existing user entries are preserved through `unique`-merge.

The statusline renders as: `Opus 4.8 | xhigh | 80k / 1000k | 92%`. Fields are model name, effort level, tokens used vs context window size, and remaining percentage. The effort field is omitted when the model does not report one. The percentage is colored by headroom: green at 30% or above, yellow below 30%, and red with a `⚠` prefix below 15%.

## Built-in vs toolkit features

Claude Code includes built-in features that overlap with some toolkit skills. They serve different purposes and are complementary.

### Code review

| Aspect   | Claude Code Review (built-in)                   | `claude-review` skill                                                             |
| -------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| What     | Managed service that reviews PRs on GitHub      | Local skill that reviews diffs in terminal                                        |
| Trigger  | Auto on PR push, or `@claude review` on a PR    | `/claude-review` in a Claude Code session                                         |
| Context  | Reads the full repo on Anthropic infrastructure | Reads project docs (REQUIREMENTS, ARCHITECTURE) plus auto-loaded `.claude/rules/` |
| Output   | Inline PR comments with severity tags           | Terminal findings grouped by file                                                 |
| Best for | Post-push review on GitHub                      | Pre-push local review aware of project docs and governance                        |

Use both: run `claude-review` locally before pushing, then let Code Review catch anything on the PR.

### Planning

| Aspect     | Plan mode                                        | Ultraplan                                               | `claude-feature` skill                                                                                                                                     |
| ---------- | ------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What       | Permission mode: Claude explores but cannot edit | Cloud-based plan drafting with browser review UI        | Skill that reads project docs and proposes files to touch                                                                                                  |
| Activation | `Shift+Tab` or `/plan`                           | `/ultraplan` or the word "ultraplan" in prompt          | `/claude-feature`                                                                                                                                          |
| Output     | Free-form plan in terminal                       | Rich plan in browser with inline comments and reactions | Structured output: summary, files to touch, risks, and questions that each carry a suggested answer                                                        |
| Context    | Whatever Claude reads during exploration         | Same, but on cloud infrastructure                       | Explicitly reads REQUIREMENTS, ARCHITECTURE, DESIGN, TASKS, and the relevant `.claude/wireframes/<surface>.md`. Coding rules in `.claude/rules/` auto-load |

Plan mode is a permission mode that restricts Claude to read-only exploration. `claude-feature` is a structured prompt that forces a specific output format and reads specific project docs. They solve different problems and can be used together: enter plan mode, then invoke `claude-feature` for a scoped proposal grounded in your project docs.
