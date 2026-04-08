# Claude tooling

Claude Code plugin and skills for the Toolkit.

## Structure

```plaintext
claude/
├── skills/              ← plugin skills (auto-discovered by plugin)
│   ├── claude-docs/         ← update .claude/ planning docs to reflect mid-cycle decisions
│   ├── claude-feature/      ← plan a feature by reading Claude setup and scanning source files
│   ├── claude-review/       ← review all changes since main for bugs, edge cases, and logic flaws
│   ├── claude-ui-test/      ← generate and run Playwright e2e tests for UI changes
│   ├── create-skill/        ← create a new skill file in .claude/skills/
│   ├── create-snippet/      ← create a new snippet file in the correct category folder
│   ├── docs-sync/           ← rewrite stale README.md and docs/*.md sections since main
│   ├── git-branch/          ← rename current branch to conventional format
│   ├── git-commit/          ← generate conventional commit message from staged changes
│   ├── git-pr/              ← generate PR description and open pull request
│   ├── git-ship/            ← run the full post-feature workflow in one sequence
│   ├── git-split/           ← split a mixed-commit branch into focused branches
│   ├── git-stage/           ← batch-commit staged files grouped by concern
│   ├── release-changelog/   ← generate changelog entry from commits and staged changes since main
│   └── session-resume/      ← resume in-progress work from memory at session start
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

```bash
claude --plugin-dir /path/to/toolkit/claude
```

Add to your shell config to load automatically:

```bash
alias claude='claude --plugin-dir /path/to/toolkit/claude'
```

## Plugin skills

Plugin skills live in `claude/skills/` and are auto-discovered when Claude Code loads with `--plugin-dir`. No registration needed, folder presence is enough. Each skill is a kebab-case folder containing `SKILL.md`.

| Skill               | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| `claude-docs`       | Update .claude/ planning docs to reflect mid-cycle decisions                       |
| `claude-feature`    | Plan a feature by reading Claude setup and scanning source files                   |
| `claude-review`     | Review all changes since main for bugs, edge cases, and logic flaws                |
| `claude-ui-test`    | Generate and run Playwright e2e tests, with manual checklist for visual-only items |
| `create-skill`      | Create a new skill file in .claude/skills/                                         |
| `create-snippet`    | Create a new snippet file in snippets/                                             |
| `docs-sync`         | Rewrite stale README.md and docs/\*.md sections since main                         |
| `git-branch`        | Rename current branch to match conventional format                                 |
| `git-commit`        | Generate a conventional commit message from staged changes                         |
| `git-pr`            | Generate a PR description and open a pull request                                  |
| `git-split`         | Split a mixed-commit branch into focused branches and open PRs                     |
| `git-stage`         | Batch-commit staged files grouped by concern                                       |
| `release-changelog` | Generate a changelog entry from commits and staged changes since main              |
| `git-ship`          | Run the full post-feature workflow in one sequence                                 |
| `session-resume`    | Resume in-progress work from memory at session start                               |

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. Skills marked with `disable-model-invocation: true` (`claude-review`, `create-skill`, `git-ship`, `release-changelog`) require explicit invocation and will not auto-trigger. Git skills (`git-commit`, `git-pr`, `git-branch`, `git-stage`) override built-in commit and PR behavior. See `standards/skill.md` for authoring conventions.

## Internal skills

Internal skills live in `.claude/skills/` and are toolkit-only. They are not installed into target projects.

| Skill             | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `aitk-claude`     | Load before editing plugin skills or `docs/claude.md` |
| `aitk-gemini`     | Load before editing Gemini commands                   |
| `aitk-governance` | Load before editing Cursor rules or stack definitions |
| `aitk-prompts`    | Load before editing system prompt templates           |
| `aitk-scripts`    | Load before editing scripts or sandbox scenarios      |
| `aitk-snippets`   | Load before editing snippets or `snippets.toml`       |
| `aitk-standards`  | Load before editing standards or docs                 |
| `aitk-tooling`    | Load before editing tooling stacks or golden configs  |

## CLI

| Command              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `aitk claude init`   | Seed `.claude/` workflow docs and `CLAUDE.md` into a project |
| `aitk claude roles`  | Install role prompts (planner, implementer, reviewer)        |
| `aitk claude sync`   | Diff managed files against source and apply updates          |
| `aitk claude prompt` | Generate master prompts from installed governance rules      |
| `aitk claude gov`    | Build governance rules into `.claude/GOV.md`                 |
| `aitk claude setup`  | Install user-level Claude config to `~/.claude/`             |

### init

Seeds `.claude/` with project docs (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `TASKS.md`, `DESIGN.md`, `WIREFRAMES.md`, `GOV.md`, `settings.json`). Also seeds `CLAUDE.md` at the project root and merges `.gitignore` entries. Skips files already present. Run once per project.

Pass `--roles` to also install role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`). Roles are optional and designed for AI chat workflows where you paste prompts with injected governance rules. Claude Code's agentic mode does not need them.

### roles

Installs role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`) into `.claude/`. Use this for chat-based AI workflows where you generate master prompts via `aitk claude prompt`. Not needed for Claude Code's default agentic workflow.

### sync

Checks seeded project docs and, if roles are installed, diffs them against the toolkit source and applies updates. Never touches seeded project docs. Offers a diff review before applying. Only syncs roles when at least one role file is present in the target.

### prompt

Reads `PLANNER.md` and `IMPLEMENTER.md` from `.claude/`, injects context, and writes output to `.claude/.tmp/`. Also copies `REVIEWER.md` to `.claude/.tmp/`. Requires roles to be installed.

For `PLANNER.md`: injects `standards/prose.md`, planner governance rules from the `planner` stack, and context docs (`TASKS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`, `WIREFRAMES.md`).

For `IMPLEMENTER.md`: injects all governance rules from `.cursor/rules/` and context docs (`TASKS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`).

Prerequisites: run `aitk claude init --roles` first, then `aitk gov install` to install rules for your stack.

### gov

Reads `.mdc` files from `.cursor/rules/`, strips frontmatter, concatenates them, and writes `.claude/GOV.md`. Claude Code loads this file automatically each session to provide governance context inline. `aitk sync` regenerates it automatically if `.claude/GOV.md` already exists in the target.

Prerequisites: run `aitk gov install` first to populate `.cursor/rules/`.

### setup

Copies `statusline-command.sh` from `tooling/claude/user/` to `~/.claude/` and patches `~/.claude/settings.json` to register it as the statusline command. Idempotent — skips files that already match. Run once per machine after cloning the toolkit.

The statusline renders as: `Sonnet 4.6 | 40k / 200k | 20%`. Fields are model name, tokens used vs context window size, and remaining percentage. The percentage shows a `⚠` prefix when below 15%.

## Built-in vs toolkit features

Claude Code includes built-in features that overlap with some toolkit skills. They serve different purposes and are complementary.

### Code review

| Aspect   | Claude Code Review (built-in)                   | `claude-review` skill                                      |
| -------- | ----------------------------------------------- | ---------------------------------------------------------- |
| What     | Managed service that reviews PRs on GitHub      | Local skill that reviews diffs in terminal                 |
| Trigger  | Auto on PR push, or `@claude review` on a PR    | `/claude-review` in a Claude Code session                  |
| Context  | Reads the full repo on Anthropic infrastructure | Reads project docs (REQUIREMENTS, ARCHITECTURE, GOV)       |
| Output   | Inline PR comments with severity tags           | Terminal findings grouped by file                          |
| Best for | Post-push review on GitHub                      | Pre-push local review aware of project docs and governance |

Use both: run `claude-review` locally before pushing, then let Code Review catch anything on the PR.

### Planning

| Aspect     | Plan mode                                         | Ultraplan                                               | `claude-feature` skill                                                      |
| ---------- | ------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| What       | Permission mode — Claude explores but cannot edit | Cloud-based plan drafting with browser review UI        | Skill that reads project docs and proposes files to touch                   |
| Activation | `Shift+Tab` or `/plan`                            | `/ultraplan` or the word "ultraplan" in prompt          | `/claude-feature`                                                           |
| Output     | Free-form plan in terminal                        | Rich plan in browser with inline comments and reactions | Structured output: files to touch, risks, questions                         |
| Context    | Whatever Claude reads during exploration          | Same, but on cloud infrastructure                       | Explicitly reads REQUIREMENTS, ARCHITECTURE, DESIGN, TASKS, WIREFRAMES, GOV |

Plan mode is a permission mode that restricts Claude to read-only exploration. `claude-feature` is a structured prompt that forces a specific output format and reads specific project docs. They solve different problems and can be used together: enter plan mode, then invoke `claude-feature` for a scoped proposal grounded in your project docs.

### Roles vs agentic mode

The toolkit originally shipped role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`) for chat-based AI workflows where you paste generated master prompts with injected governance rules. Claude Code's agentic mode makes this unnecessary — it reads `CLAUDE.md` and `.claude/GOV.md` directly, skills handle orchestration, and plan mode handles the "think before you act" workflow natively.

Roles are still available via `aitk claude roles` for teams that prefer chat-based workflows or use other AI tools that benefit from structured role prompts.
