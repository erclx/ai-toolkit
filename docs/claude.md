# Claude tooling

Claude Code plugin and skills for the Toolkit.

## Structure

```plaintext
claude/
├── skills/              ← plugin skills (auto-discovered by plugin)
│   ├── git-commit/      ← generate conventional commit message from staged changes
│   ├── git-pr/          ← generate PR description and open pull request
│   └── git-branch/      ← rename current branch to conventional format
└── .claude-plugin/
    └── plugin.json      ← plugin manifest
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

| Skill        | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `git-commit` | Generate a conventional commit message from staged changes |
| `git-branch` | Rename current branch to match conventional format         |
| `git-pr`     | Generate a PR description and open a pull request          |

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. See `standards/skill.md` for authoring conventions.

## CLI

| Command                   | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `aitk claude init`        | Seed `.claude/` workflow docs and `CLAUDE.md` into a project |
| `aitk claude sync`        | Diff managed role prompts against source and apply updates   |
| `aitk claude prompt`      | Generate master prompts from installed governance rules      |
| `aitk claude gov`         | Build governance rules into `.claude/GOV.md`                 |
| `aitk claude gov [stack]` | Build a stack-filtered subset into `.claude/GOV-[STACK].md`  |

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

Reads `.mdc` files from `.cursor/rules/`, strips frontmatter, concatenates them, and writes `.claude/GOV.md`. Claude Code loads this file automatically each session to provide governance context inline. Pass an optional stack name to build a filtered subset into `.claude/GOV-[STACK].md`.

Prerequisites: run `aitk gov install` first to populate `.cursor/rules/`.
