# Claude tooling

Claude Code plugin and skills for the Toolkit.

## Structure

```plaintext
claude/
├── skills/              ← plugin skills (auto-discovered by plugin)
│   ├── ai-sync/             ← suggest edits to CLAUDE.md and GEMINI.md based on recent changes
│   ├── claude-docs/         ← update .claude/ planning docs to reflect mid-cycle decisions
│   ├── claude-feature/      ← plan a feature by reading Claude setup and scanning source files
│   ├── claude-ui-test/      ← generate a manual browser verification checklist from session context
│   ├── create-snippet/      ← create a new snippet file in the correct category folder
│   ├── git-branch/          ← rename current branch to conventional format
│   ├── git-commit/          ← generate conventional commit message from staged changes
│   ├── git-pr/              ← generate PR description and open pull request
│   ├── git-split/           ← split a mixed-commit branch into focused branches
│   ├── git-stage/           ← batch-commit staged files grouped by concern
│   └── release-changelog/   ← generate changelog entry from commits since main
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
├── aitk-tooling/            ← tooling stacks domain
└── aitk-session-resume/     ← resume in-progress work from memory
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

| Skill               | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `ai-sync`           | Suggest edits to CLAUDE.md and GEMINI.md based on recent changes      |
| `claude-docs`       | Update .claude/ planning docs to reflect mid-cycle decisions          |
| `claude-feature`    | Plan a feature by reading Claude setup and scanning source files      |
| `claude-ui-test`    | Generate a manual browser verification checklist from session context |
| `create-snippet`    | Create a new snippet file in snippets/                                |
| `docs-sync`         | Rewrite stale README.md and docs/\*.md sections since main            |
| `git-branch`        | Rename current branch to match conventional format                    |
| `git-commit`        | Generate a conventional commit message from staged changes            |
| `git-pr`            | Generate a PR description and open a pull request                     |
| `git-split`         | Split a mixed-commit branch into focused branches and open PRs        |
| `git-stage`         | Batch-commit staged files grouped by concern                          |
| `release-changelog` | Generate a changelog entry from commits since main                    |
| `git-ship`          | Run the full post-feature workflow in one sequence                    |

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. See `standards/skill.md` for authoring conventions.

## Internal skills

Internal skills live in `.claude/skills/` and are toolkit-only. They are not installed into target projects.

| Skill                 | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `aitk-claude`         | Load before editing plugin skills or `docs/claude.md` |
| `aitk-gemini`         | Load before editing Gemini commands                   |
| `aitk-governance`     | Load before editing Cursor rules or stack definitions |
| `aitk-prompts`        | Load before editing system prompt templates           |
| `aitk-scripts`        | Load before editing scripts or sandbox scenarios      |
| `aitk-snippets`       | Load before editing snippets or `snippets.toml`       |
| `aitk-standards`      | Load before editing standards or docs                 |
| `aitk-tooling`        | Load before editing tooling stacks or golden configs  |
| `aitk-session-resume` | Resume in-progress work from memory at session start  |

## CLI

| Command              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `aitk claude init`   | Seed `.claude/` workflow docs and `CLAUDE.md` into a project |
| `aitk claude sync`   | Diff managed role prompts against source and apply updates   |
| `aitk claude prompt` | Generate master prompts from installed governance rules      |
| `aitk claude gov`    | Build governance rules into `.claude/GOV.md`                 |

### init

Seeds `.claude/` with role prompt templates (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`) and state documents (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `TASKS.md`, `DESIGN.md`, `WIREFRAMES.md`). Also seeds `CLAUDE.md` at the project root and merges `.gitignore` entries. Skips files already present. Run once per project.

### sync

Diffs the three managed role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`) against the toolkit source and applies updates. Never touches seeded state documents. Offers a diff review before applying.

### prompt

Reads `PLANNER.md` and `IMPLEMENTER.md` from `.claude/`, injects context, and writes output to `.claude/.tmp/`. Also copies `REVIEWER.md` to `.claude/.tmp/`.

For `PLANNER.md`: injects `standards/prose.md`, planner governance rules from the `planner` stack, and context docs (`TASKS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`, `WIREFRAMES.md`).

For `IMPLEMENTER.md`: injects all governance rules from `.cursor/rules/` and context docs (`TASKS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`).

Prerequisites: run `aitk claude init` first, then `aitk gov install` to install rules for your stack.

### gov

Reads `.mdc` files from `.cursor/rules/`, strips frontmatter, concatenates them, and writes `.claude/GOV.md`. Claude Code loads this file automatically each session to provide governance context inline.

Prerequisites: run `aitk gov install` first to populate `.cursor/rules/`.
