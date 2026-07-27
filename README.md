# aitk

_Agent-first toolkit for AI-assisted development._

Every AI coding setup accumulates the same assets. Prompts to reuse, rules agents should follow, slash commands, skills, seed docs, sync scripts. Across enough projects the copies drift, and agents stop getting consistent signals.

`aitk` is one authoritative source for those assets and a CLI that installs and syncs them into any project. It ships a Claude Code plugin with skills for planning, review, docs sync, and the git ship chain, plus shared rules, snippet libraries, and seed docs.

## Why

Three design choices shape the toolkit.

- Agent-first: every command has a non-interactive path and a JSON catalog. If a Claude Code skill or any other agent cannot drive the CLI without prompts, the design is wrong.
- Text-native: conventions, rules, and prompts are authored as markdown that humans and agents read the same way. No hidden behavior, no compiled state.
- One source, many consumers: this repo is the authoritative copy. Target projects install and sync on demand, never author in place.

## Prerequisites

- [Bun](https://bun.sh) for the CLI runtime and scripts
- [Git](https://git-scm.com) with worktree support
- [GitHub CLI](https://cli.github.com) (optional) for ship flows
- Shell: `zsh` or bash 4+ (`brew install bash` on macOS).

## Quickstart

Clone the repo, then run the bootstrap script. It installs dependencies, links the CLI globally, and adds the Claude Code shell aliases to `~/.zshrc`.

```bash
git clone https://github.com/erclx/aitk.git
cd aitk
bun install
bun run bootstrap
```

The script is idempotent. Re-run it after pulling upstream changes without duplicating anything. It confirms the install by resolving `aitk --help` on the last step. See [zshrc aliases](wiki/zshrc-aliases.md) for what each alias does.

Scaffold a fresh project.

```bash
mkdir ~/my-project && cd ~/my-project
git init
aitk init
```

`aitk init` installs base tooling configs, Claude seeds, standards, snippets, and a wiki stub in one pass. Pass `--stack <name>` to also install governance rules for a framework stack into `.claude/rules/`. Run `aitk tooling list --json` to see the catalog.

For the full outsider journey (scaffold, add a domain later, sync upstream drift), see [target projects](docs/target-projects.md).

## What is inside

Each domain has a canonical source in this repo and a thin install or sync CLI on the target side.

- [Claude Code plugin](.claude/context/claude.md): skills for planning, review, docs sync, and the git ship chain
- [Governance rules](.claude/context/governance.md): Cursor rules and stacks, installable per project
- [Standards](.claude/context/standards.md): shared authoring conventions, synced to projects
- [Snippets](.claude/context/snippets.md): reusable prompts for Claude and Gemini chat
- [Tooling stacks](.claude/context/tooling.md): golden configs, seeds, and references per framework
- [Design system](.claude/context/design.md): `DESIGN.md` token shape, extract skill, render command
- [Slides](.claude/context/slides.md): `SLIDES.md` source, layout catalog, render command, draft skill
- [Transcripts](.claude/context/transcripts.md): fetch a YouTube transcript with metadata frontmatter via `aitk transcripts`
- [Sandbox](.claude/context/sandbox.md): scenario-based scaffolds for verifying each domain flow

## Documentation

- [AI workflow](docs/ai-workflow.md): feature-development loop inside a toolkit-managed project
- [Target projects](docs/target-projects.md): scaffold, add a domain later, sync upstream drift
- [Agents](docs/agents.md): CLI flags, exit codes, and JSON output shapes
- [Docs index](docs/index.md): every reference doc in this repo

## Contributing

Portfolio project. Issues are welcome. Pull requests are accepted by invitation only.

## License

[MIT](LICENSE)
