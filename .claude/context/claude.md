---
title: Claude
description: Claude plugin skills and tooling
---

# Claude tooling

Claude Code plugin and skills for the Toolkit.

## Structure

```plaintext
claude/
├── skills/              ← plugin skills (auto-discovered by plugin)
│   ├── bash-script/         ← generate production bash scripts with a visual timeline UI
│   ├── ci-workflow/         ← generate GitHub Actions CI workflow files
│   ├── claude-diagram/      ← draft .claude/DIAGRAMS.md with mermaid diagrams from architecture and code signals
│   ├── claude-docs/         ← update .claude/ planning docs to reflect mid-cycle decisions
│   ├── claude-feature/      ← plan a feature by reading Claude setup and scanning source files
│   ├── claude-memory-capture/ ← extract durable patterns from the session into `.claude/memory/`
│   ├── claude-memory-review/ ← review `.claude/memory/` and propose per-entry promote, consolidate, handoff, or delete
│   ├── claude-review/       ← review all changes since main for bugs, edge cases, and logic flaws
│   ├── claude-screencast/   ← draft a stack-agnostic screencast script with pre-seeded beats and defaults
│   ├── claude-slides-draft/ ← draft a .claude/SLIDES.md source and render it to PowerPoint via aitk slides render
│   ├── claude-standards-audit/ ← audit changed markdown files against applicable authoring standards
│   ├── claude-ui-test/      ← generate and run Playwright e2e tests for UI changes
│   ├── claude-ux-audit/     ← audit existing UI surfaces for missing states, edge cases, and inconsistencies
│   ├── claude-worktree/     ← enter a worktree at .claude/worktrees/<name>/ with name derived from plan or branch
│   ├── claude-autoship/     ← chain implement → verify → review → ship after a plan is approved
│   ├── claude-context-migrate/ ← classify docs/ content and propose `git mv` to .claude/context/
│   ├── claude-standards-relocate/ ← propose `git mv` of root standards/ and snippets/ into .claude/
│   ├── create-rule/         ← scaffold a project-local governance rule into .claude/rules/
│   ├── create-skill/        ← create a new skill file in .claude/skills/
│   ├── create-snippet/      ← create a new snippet file in the correct category folder
│   ├── docs-sync/           ← rewrite stale README.md and docs/*.md sections since main
│   ├── git-branch/          ← rename current branch to conventional format
│   ├── git-commit/          ← generate conventional commit message from staged changes
│   ├── git-followup/        ← stage, commit, push, and sync the open PR for a small followup edit
│   ├── git-pr/              ← generate PR description and open pull request
│   ├── git-ship/            ← run the full post-feature workflow in one sequence
│   ├── git-split/           ← split a mixed-commit branch into focused branches
│   ├── git-stage/           ← batch-commit staged files grouped by concern
│   ├── git-worktree/        ← list and clean up linked worktrees after shipping
│   ├── toolkit-operator/    ← front door: orient on toolkit docs, then run or route any operation
│   ├── session-resume/      ← resume from tracked work and relevant context at session start
│   ├── setup-gov/           ← detect project stack and install matching governance rules
│   ├── setup-indexes/       ← bootstrap the index.md system in a target project
│   ├── setup-init/          ← detect project type and run one-shot `aitk init` with resolved flags
│   ├── setup-verify/        ← run package.json scripts after scaffold to catch config and wiring mistakes
│   ├── systematic-debugging/ ← enforce root-cause investigation before fixes when a test fails or a bug surfaces
│   └── youtube-transcripts/ ← fetch a YouTube transcript with metadata frontmatter via aitk transcripts
└── .claude-plugin/
    └── plugin.json      ← plugin manifest

.claude/skills/          ← internal skills (toolkit repo only)
├── aitk-claude/             ← Claude plugin and tooling domain
├── aitk-gemini/             ← Gemini commands domain
├── aitk-governance/         ← Cursor rules domain
├── aitk-prompts/            ← system prompt templates domain
├── aitk-scripts/            ← bash scripts domain
├── aitk-snippets/           ← snippets domain
├── aitk-standards/          ← standards and docs domain
└── aitk-tooling/            ← tooling stacks domain
```

## Setup

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

For the full alias set covering resume, continue, worktree, and model shortcuts, see [Zshrc aliases for Claude Code](../../wiki/zshrc-aliases.md).

## Three-tier context model

Target projects scale by splitting context across three loading tiers. Knowing which tier holds what keeps sessions fast and content discoverable.

| Tier             | Surface                                                                | Load behavior                                        | Holds                                                                     |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Always loaded    | Root `CLAUDE.md`, `.claude/REQUIREMENTS.md`, `.claude/ARCHITECTURE.md` | Eager at session start                               | Cross-cutting behavior, product scope, project-wide invariants            |
| Path-scoped lazy | `.claude/rules/<scope>.md` with `paths:` frontmatter                   | Lazy by glob match when files are read               | Do/don't rules, naming and pattern conventions for a file scope           |
| On-demand lookup | `.claude/context/<domain>.md`, `.claude/wireframes/<surface>.md`       | Read by Claude when the domain or surface is touched | Per-domain narrative and per-surface layout intent, indexed for discovery |

`.claude/context/<domain>.md` is the new tier introduced for larger projects. It exists because nested `CLAUDE.md` files would auto-load along the cwd's ancestor chain and bloat context as a session walks the repo. The `index.md` lookup pattern keeps the cost on-demand.

### What goes where

For prescriptive rules on entry shape (frontmatter, encouraged sections, what goes / what does not go), see `.claude/standards/context.md`. The conceptual placement decision is:

- Per-domain narrative → `.claude/context/<domain>.md`
- Path-scoped rules → `.claude/rules/<scope>.md` with `paths:` glob
- Tutorials or human onboarding → `docs/` if a public audience exists
- Function-level docs → read the code instead

### Layout

Flat by default: one `.md` per domain (`.claude/context/web.md`, `.claude/context/api.md`). Use a folder (`.claude/context/<domain>/<sub-area>.md`) only when a domain has 3+ sub-areas that don't fit cleanly in one file. The indexes system handles nested folders natively.

`.claude/context/index.md` is regenerated by `aitk indexes regen` from each entry's `title` and `description` frontmatter. Same pattern as `wiki/index.md`. Do not hand-edit.

### How entries get populated

`claude-docs` runs at ship time (via `git-ship` or `claude-autoship`). It reads the diff, maps changed files to existing `.claude/context/<domain>.md` entries that reference those files, and rewrites the affected sections from the diff content. Same pattern `docs-sync` uses for README and `docs/*.md`.

New entries are not created automatically. Auto-creation risks padding the catalog with low-signal entries that get refreshed every PR. Create a new entry by hand following `.claude/standards/context.md`, then `claude-docs` keeps it current on subsequent ships.

This is ship-time and not plan-time because the plan describes intent, while context entries should reflect what was actually built. Plans drift during implementation. The diff is the source of truth.

## Orchestration

Larger projects use an orchestrator session that breaks work into TASKS entries and hands each entry to a worker session running in a linked worktree. The toolkit ships two artifacts to make this flow mechanical.

| Artifact                          | Author                 | Holds                                                                                     | Lifecycle                                             |
| --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `.claude/TASKS.md`                | orchestrator           | One block per task with outcomes and a test strategy. Phase labels live here.             | Gitignored, shared across worktrees.                  |
| `.claude/plans/feature-<slug>.md` | orchestrator or worker | Files to touch with reasons, optional constraints, risks, answered questions for one task | Gitignored, shared across worktrees, deleted on ship. |

Drafting flow: orchestrator writes a TASKS block, runs `claude-feature` to produce a plan carrying the reading list and any constraints, then hands the worker a plan slug. Worker enters a linked worktree, reads the plan, and implements. `claude-docs` deletes the plan when the task ships.

Phase labels stay inside TASKS. They never appear in PR titles, commit messages, or git tags. See `.claude/standards/versioning.md` for the rules and the why.

## Plugin skills

Plugin skills live in `claude/skills/` and are auto-discovered when Claude Code loads with `--plugin-dir`. No registration needed, folder presence is enough. Each skill is a kebab-case folder containing `SKILL.md`.

| Skill                       | Description                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `bash-script`               | Generate production bash scripts with a visual timeline UI and error handling                |
| `ci-workflow`               | Generate GitHub Actions CI workflow files with parallel, gated jobs                          |
| `claude-design-extract`     | Draft `.claude/DESIGN.md` from existing prose and shell UI surfaces                          |
| `claude-design-propose`     | Draft `.claude/DESIGN.md` on day one from REQUIREMENTS.md and a personality paragraph        |
| `claude-diagram`            | Draft `.claude/DIAGRAMS.md` with mermaid diagrams from architecture and code signals         |
| `claude-docs`               | Update .claude/ planning docs to reflect mid-cycle decisions                                 |
| `claude-feature`            | Plan a feature by reading Claude setup and scanning source files                             |
| `claude-memory-capture`     | Extract durable patterns from the session into `.claude/memory/`                             |
| `claude-memory-review`      | Review `.claude/memory/` and propose per-entry promote, consolidate, handoff, or delete      |
| `claude-review`             | Review all changes since main for bugs, edge cases, and logic flaws                          |
| `claude-screencast`         | Draft a stack-agnostic screencast script with pre-seeded beats and defaults                  |
| `claude-seed-sync`          | Audit installed seed docs and standards against toolkit sources, write per-part proposals    |
| `claude-slides-draft`       | Draft a `.claude/SLIDES.md` source and render it to PowerPoint via `aitk slides render`      |
| `claude-standards-audit`    | Audit changed markdown files against applicable authoring standards, reporting only          |
| `claude-standards-relocate` | Propose `git mv` of root standards/ and snippets/ into .claude/                              |
| `claude-ui-test`            | Generate and run Playwright e2e tests, with manual checklist for visual-only items           |
| `claude-ux-audit`           | Audit existing UI surfaces for missing states, edge cases, and inconsistencies               |
| `claude-worktree`           | Enter a worktree at `.claude/worktrees/<name>/` with name derived from plan or branch        |
| `claude-autoship`           | Chain implement → verify → review → ship after a plan is approved                            |
| `claude-context-migrate`    | Classify `docs/` content and propose `git mv` to `.claude/context/`                          |
| `create-rule`               | Scaffold a project-local governance rule into .claude/rules/                                 |
| `create-skill`              | Create a new skill file in .claude/skills/                                                   |
| `create-snippet`            | Create a new snippet file in snippets/                                                       |
| `docs-sync`                 | Rewrite stale README.md and docs/\*.md sections since main                                   |
| `git-branch`                | Rename current branch to match conventional format                                           |
| `git-commit`                | Generate a conventional commit message from staged changes                                   |
| `git-followup`              | Stage, commit, push, and sync the open PR for a small followup edit                          |
| `git-pr`                    | Generate a PR description and open a pull request                                            |
| `git-split`                 | Split a mixed-commit branch into focused branches and open PRs                               |
| `git-stage`                 | Batch-commit staged files grouped by concern                                                 |
| `git-worktree`              | List and clean up linked worktrees after shipping                                            |
| `toolkit-operator`          | Front door that orients on toolkit docs and live catalogs, then runs or routes any operation |
| `setup-gov`                 | Detect project stack from files and install matching governance rules                        |
| `setup-indexes`             | Bootstrap the index.md system in a target project, drafting frontmatter per folder           |
| `setup-init`                | Detect project type and run one-shot `aitk init` with resolved flags                         |
| `git-ship`                  | Run the full post-feature workflow in one sequence                                           |
| `session-resume`            | Resume from tracked work and relevant context at session start                               |
| `systematic-debugging`      | Enforce root-cause investigation before fixes when a test fails or a bug surfaces            |
| `toolkit-feedback`          | Format a session-context feedback block and write it to the toolkit repo via `aitk feedback` |
| `setup-verify`              | Run `package.json` scripts after scaffold to catch config and wiring mistakes                |
| `youtube-transcripts`       | Fetch a YouTube transcript with metadata frontmatter via `aitk transcripts`                  |

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. Skills marked with `disable-model-invocation: true` (`claude-autoship`, `create-skill`, `git-followup`, `git-ship`, `toolkit-operator`) require explicit invocation and will not auto-trigger. Git skills (`git-commit`, `git-pr`, `git-branch`, `git-stage`) override built-in commit and PR behavior. See `.claude/standards/skill.md` for authoring conventions.

Plugin skills that shell out to the CLI follow a consistent pattern: read the toolkit catalog via `aitk <domain> list --json`, match against project context, then execute the CLI with `AITK_NON_INTERACTIVE=1` so it skips prompts. Claude Code's tool permission dialog is the single confirmation gate. Skills never reimplement CLI logic or hardcode rule, stack, or snippet names. `setup-gov` is the reference.

## Internal skills

Internal skills live in `.claude/skills/` and are toolkit-only. They are not installed into target projects.

| Skill                | Description                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `aitk-claude`        | Load before editing plugin skills, the CLAUDE.md seed, or `.claude/context/claude.md`                  |
| `aitk-gemini`        | Load before editing Gemini commands                                                                    |
| `aitk-governance`    | Load before editing Cursor rules or stack definitions                                                  |
| `aitk-prompts`       | Load before editing system prompt templates                                                            |
| `aitk-scripts`       | Load before editing scripts or sandbox scenarios                                                       |
| `aitk-snippets`      | Load before editing snippets                                                                           |
| `aitk-standards`     | Load before editing standards or docs                                                                  |
| `aitk-tooling`       | Load before editing tooling stacks or golden configs                                                   |
| `aitk-sandbox-check` | Audit changed plugin skills for missing sandbox scenario edits, user-invoked via `/aitk-sandbox-check` |

## CLI

| Command                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `aitk claude init`       | Seed `.claude/` workflow docs and `CLAUDE.md` into a project |
| `aitk claude roles`      | Install role prompts (planner, implementer, reviewer)        |
| `aitk claude roles list` | List role prompt sources, plain text or `--json` for skills  |
| `aitk claude seeds list` | List seed doc sources, plain text or `--json` for skills     |
| `aitk claude sync`       | Diff managed files against source and apply updates          |
| `aitk claude prompt`     | Generate master prompts from installed governance rules      |
| `aitk claude setup`      | Install user-level Claude config to `~/.claude/`             |

### init

Seeds `.claude/` with project docs (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `TASKS.md`, `DESIGN.md`, `wireframes/`, `settings.json`) and hook scripts under `.claude/hooks/`. Also seeds `CLAUDE.md` at the project root and merges `.gitignore` entries. Skips files already present. Run once per project. Coding and doc-authoring standards arrive separately via `aitk gov install`, which writes path-scoped rules to `.claude/rules/`.

The `.claude/wireframes/` folder ships with an `index.md` discovery anchor. Add a file per surface as the UI grows, following `.claude/standards/wireframes.md`. Read `index.md` first, then load only the surface files the current task touches. Per-surface files keep the lazy-load model honest as the project grows.

The seed `settings.json` contains only the PostToolUse hook block that pairs with the project-local `.claude/hooks/standards-audit.sh`. The hook greps markdown files for em-dashes and semicolons banned in `.claude/standards/prose.md`, excludes fenced code blocks, and emits `additionalContext` so the agent self-corrects on the next turn. Scratch dirs `.claude/.tmp/`, `.claude/memory/`, `.claude/review/`, and `.claude/plans/` are skipped.

User-level pieces (attribution, permission allows, and `.env` denies) live at `~/.claude/settings.json` and install once per machine via `aitk claude setup`. Project settings layer on top of user settings, so per-project files only need to carry what is genuinely project-specific.

Pass `--roles` to also install role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`). Roles are optional and designed for AI chat workflows where you paste prompts with injected governance rules. Claude Code's agentic mode does not need them.

### roles

Installs role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`) into `.claude/`. Use this for chat-based AI workflows where you generate master prompts via `aitk claude prompt`. Not needed for Claude Code's default agentic workflow.

`aitk claude roles list [--json|--names]` enumerates the role prompt sources without installing them. Skills consume `--json` to read each role's `name`, `source`, `target`, and `content` for in-context audits.

### seeds

`aitk claude seeds list [--json|--names]` enumerates the seed docs that `aitk claude init` would copy into a project. Skills consume `--json` to compare a target project's installed copies against the toolkit's current seed source and propose targeted edits. The CLI only emits content. Reconciliation is the skill's job (see `claude-seed-sync`).

### sync

Checks seeded project docs and, if roles are installed, diffs them against the toolkit source and applies updates. Also reconciles `.gitignore` against the `[gitignore]` section of `tooling/claude/manifest.toml`: appends any missing entries and prunes entries inside the `# Claude` section that the manifest no longer declares. Removed entries are logged as `-` lines. Never touches seeded project docs. Offers a diff review before applying role drift. Only syncs roles when at least one role file is present in the target.

`aitk sync` invokes this command with `AITK_NON_INTERACTIVE=1` when `.claude/` exists in the target, so role drift lands in the combined toolkit-sync PR alongside other domains. Seed audits are not automated. Run the `claude-seed-sync` skill for per-part reconciliation across the preamble and each `##` section. `aitk sync` prints a tip reminder at the tail.

### prompt

Reads `PLANNER.md` and `IMPLEMENTER.md` from `.claude/`, injects context, and writes output to `.claude/.tmp/roles/`. Also copies `REVIEWER.md` to `.claude/.tmp/roles/`. Requires roles to be installed.

For `PLANNER.md`: injects `standards/prose.md`, planner governance rules from the `planner` stack, and context docs (`TASKS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`, and the concatenated surface files under `.claude/wireframes/`).

For `IMPLEMENTER.md`: injects all governance rules from `.claude/rules/` and context docs (`TASKS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`).

Prerequisites: run `aitk claude init --roles` first, then `aitk gov install` to install rules into `.claude/rules/` for the prompt builder.

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
| Output     | Free-form plan in terminal                       | Rich plan in browser with inline comments and reactions | Structured output: summary, files to touch, risks, questions                                                                                               |
| Context    | Whatever Claude reads during exploration         | Same, but on cloud infrastructure                       | Explicitly reads REQUIREMENTS, ARCHITECTURE, DESIGN, TASKS, and the relevant `.claude/wireframes/<surface>.md`. Coding rules in `.claude/rules/` auto-load |

Plan mode is a permission mode that restricts Claude to read-only exploration. `claude-feature` is a structured prompt that forces a specific output format and reads specific project docs. They solve different problems and can be used together: enter plan mode, then invoke `claude-feature` for a scoped proposal grounded in your project docs.

### Roles vs agentic mode

The toolkit originally shipped role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`) for chat-based AI workflows where you paste generated master prompts with injected governance rules. Claude Code's agentic mode makes this unnecessary. It reads `CLAUDE.md` and the `.claude/rules/` tree directly, skills handle orchestration, and plan mode handles the "think before you act" workflow natively.

Roles are still available via `aitk claude roles` for teams that prefer chat-based workflows or use other AI tools that benefit from structured role prompts.
