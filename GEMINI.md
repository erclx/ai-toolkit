# AI Toolkit - Gemini CLI Extension Context

Defines instructional context for the Gemini CLI agent. Specifies project purpose, functionalities, and operational conventions for assistance in development, standards adherence, and tool usage.

## Project Overview

The AI Toolkit extends the Gemini CLI with automated governance, versioning, and discovery tools. Custom commands improve code quality and manage releases. Integrates with Git for version control, shell scripting for automation, and markdown for governance rules and documentation.

## Building and Running

Commands for setup, build, and maintenance.

### Installation

Install and link the toolkit locally:

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link .
```

### Setup Governance Rules and Documentation

Compile governance rules and synchronize documentation to generate Gemini CLI command definitions.

```bash
./scripts/build-gov.sh
```

Execution details:
- Processes markdown rules (`scripts/assets/cursor/rules/*.mdc`) and documentation (`scripts/assets/docs/*.md`) via `scripts/build/compiler.sh`
- Generates command definitions (`commands/gov/rules.toml` and `commands/gov/docs.toml`)
- Syncs documentation from `scripts/assets/docs` to `docs/`
- Stages and commits generated artifacts

### Linting

Check spelling errors:

```bash
bun run lint:spelling
```

## Development Conventions

Conventions ensure consistency and effective Gemini CLI usage.

### Gemini CLI Command Definitions

- Define custom commands in `.toml` files within `commands/`.
- Reference external files to provide context, standards, or dynamic data.
- Example: `commands/git/commit.toml` references `docs/commit.md` for conventional commit standards.

### Governance Rules

- Author rules in `.mdc` (Markdown with Code) files under `scripts/assets/cursor/rules/`.
- `scripts/build-gov.sh` compiles files into command definitions for consistent application.

### Documentation

- Write documentation in standard Markdown (`.md`).
- Store sources in `scripts/assets/docs/`.
- `scripts/build-gov.sh` syncs sources to the root `docs/` directory.

## Available Gemini Commands

Custom commands assist development tasks:

- `/ai-toolkit.setup:rules`: Installs local Cursor governance rules.
- `/ai-toolkit.setup:cursor`: Creates governance rule testing sandbox.
- `/ai-toolkit.git:commit`: Generates atomic conventional commit messages from staged changes.
- `/ai-toolkit.git:pr`: Drafts PRs and writes documentation-focused descriptions.
- `/ai-toolkit.release:changelog`: Builds release history.
