# aitk

One source for your repos' AI conventions. Install once, sync everywhere.

![Adding the aitk marketplace and installing the plugin in Claude Code](assets/install.png)

## Install

Add the marketplace, then install the Claude Code plugin.

```bash
claude plugin marketplace add https://github.com/erclx/aitk
claude plugin install aitk@aitk
```

The skills are then available as `/aitk:<name>`. Run `/reload-plugins` to pick them up inside a session that was already open. Updates arrive on release, so a push to this repo does not reach an installed copy.

Several skills call the `aitk` CLI to read catalogs and run installs, and the plugin does not put it on your path. Follow [development](#development) to link it until it ships to a package registry.

## Why

Every AI coding setup accumulates the same assets. Prompts to reuse, rules agents should follow, slash commands, skills, seed docs, sync scripts. Across enough projects the copies drift, and agents stop getting consistent signals.

Three design choices shape the toolkit.

- Agent-first: every command has a non-interactive path and a JSON catalog. If a Claude Code skill or any other agent cannot drive the CLI without prompts, the design is wrong.
- Text-native: conventions, rules, and prompts are authored as markdown that humans and agents read the same way. No hidden behavior, no compiled state.
- One source, many consumers: this repo is the authoritative copy. Target projects install and sync on demand, never author in place.

## What is inside

Each domain has a canonical source in this repo and a thin install or sync CLI on the target side. The links run to internal narrative, written for someone maintaining the toolkit rather than installing it.

- [Claude Code plugin](.claude/context/claude-plugin.md): skills for planning, review, docs sync, and the git ship chain
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

## Development

Working on the toolkit, or running the CLI in your own terminal, starts from a clone.

### Prerequisites

- [Bun](https://bun.sh) for the CLI runtime and scripts
- [Git](https://git-scm.com) with worktree support
- [GitHub CLI](https://cli.github.com) (optional) for ship flows
- Shell: `zsh` or bash 4+ (`brew install bash` on macOS).

Clone the repo, then run the bootstrap script. It installs dependencies, links the CLI globally, and adds the Claude Code shell aliases to `~/.zshrc`.

```bash
git clone https://github.com/erclx/aitk.git
cd aitk
bun install
bun run bootstrap
```

The script is idempotent. Re-run it after pulling upstream changes without duplicating anything. It confirms the install by resolving `aitk --help` on the last step. See [zshrc aliases](wiki/zshrc-aliases.md) for what each alias does.

With the CLI linked, scaffold a fresh project.

```bash
mkdir ~/my-project && cd ~/my-project
git init
aitk init
```

`aitk init` installs base tooling configs, Claude seeds, standards, and snippets in one pass, and scaffolds a `.claude/wiki/` stub for the project's own reference pages. Pass `--stack <name>` to also install governance rules into `.claude/rules/`. Without it the domain is skipped, and the coding standards that load on a file match are the half a bare install leaves out. Run `aitk tooling list --json` to see the catalog.

For the full outsider journey (scaffold, add a domain later, sync upstream drift), see [target projects](docs/target-projects.md).

## Contributing

Portfolio project. Issues are welcome. Pull requests are accepted by invitation only. See the [contributing guidelines](CONTRIBUTING.md) for the local loop, the authoring split, and the commit convention.

## License

[MIT](LICENSE)
