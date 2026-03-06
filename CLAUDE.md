# AI Toolkit Context

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects. Rules are authored in `.cursor/rules/`, distributed via governance sync. Standards sync as plain markdown. Tooling stacks are scaffolded from `tooling/` manifests.

## Key Paths

- `.cursor/rules/` — governance rules
- `standards/` — reference docs synced to target projects
- `tooling/` — golden configs and manifests per stack
- `gemini/commands/` — Gemini CLI command definitions
- `claude/commands/` — Claude Code slash commands
- `scripts/` — build, sync, sandbox, and prompt generation scripts

## Commands

- `bun check` — lint, format, spell check
- `bun format` — auto-fix formatting
- `bun clean` — remove generated artifacts

## Skills

Task-specific context lives in `.claude/skills/`. Read the relevant skill before editing scripts, tooling, standards, governance rules, prompts, or Gemini commands.
