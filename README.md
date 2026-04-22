# aitk

_Agent-first toolkit for AI-assisted development._

Every AI coding setup accumulates the same assets. Prompts to reuse, rules agents should follow, slash commands, skills, seed docs, sync scripts. Across enough projects the copies drift, and agents stop getting consistent signals.

`aitk` is one authoritative source for those assets and a CLI that installs and syncs them into any project. It ships a Claude Code plugin with skills for planning, review, docs sync, and the git ship chain, plus Gemini CLI commands, shared rules, snippet libraries, and seed docs.

## Why

Three design choices shape the toolkit.

- Agent-first: every command has a non-interactive path and a JSON catalog. If a Claude Code skill or any other agent cannot drive the CLI without prompts, the design is wrong.
- Text-native: conventions, rules, and prompts are authored as markdown that humans and agents read the same way. No hidden behavior, no compiled state.
- One source, many consumers: this repo is the authoritative copy. Target projects install and sync on demand, never author in place.

## Prerequisites

- [Bun](https://bun.sh) for the CLI runtime and scripts
- [Git](https://git-scm.com) with worktree support
- [GitHub CLI](https://cli.github.com) (optional) for ship flows
- Shell: `zsh` or `bash`

## Quickstart

Clone, install dependencies, and link the CLI globally.

```bash
git clone https://github.com/erclx/aitk.git
cd aitk
bun install
bun link
```

Confirm the install.

```bash
aitk --help
```

Scaffold a fresh project.

```bash
mkdir ~/my-project && cd ~/my-project
git init
aitk init
```

`aitk init` installs base tooling configs, Claude seeds, governance rules, snippets, and a wiki stub. Pass `--stack <name>` to target a framework stack, or run `aitk tooling list --json` to see the catalog.

For the full outsider journey (scaffold, add a domain later, sync upstream drift), see [target projects](docs/target-projects.md).

## What is inside

Each domain has a canonical source in this repo and a thin install or sync CLI on the target side.

- [governance](docs/governance.md): Cursor rules, stacks, install and sync
- [standards](docs/standards.md): authoring conventions synced to projects
- [claude](docs/claude.md): Claude Code plugin and skills
- [gemini](docs/gemini.md): Gemini CLI command definitions
- [snippets](docs/snippets.md): reusable prompt snippets for Claude and Gemini
- [prompts](docs/prompts.md): system prompt templates for AI authoring
- [tooling](docs/tooling.md): golden configs, seeds, and references per stack
- [design](docs/design.md): DESIGN.md token shape, extract skill, render command
- [sandbox](docs/sandbox.md): scenario-based verification for advanced workflows

## Documentation

- [AI workflow](docs/ai-workflow.md): feature-development loop inside a toolkit-managed project
- [Target projects](docs/target-projects.md): scaffold, add a domain later, sync upstream drift
- [Agents](docs/agents.md): CLI flags, exit codes, and JSON output shapes
- [Docs index](docs/index.md): every reference doc in this repo

## Contributing

Portfolio project. Issues are welcome. Pull requests are accepted by invitation only.

## License

[MIT](LICENSE)
