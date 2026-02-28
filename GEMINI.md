# AI Toolkit Context

CLI toolkit for managing governance rules, tooling configs, and developer standards across projects. Rules are authored in `.cursor/rules/`, compiled into Gemini CLI commands via `scripts/build-gov.sh`, and distributed to target projects. Standards sync directly as plain markdown files.

## Key Paths

- `gemini/commands/**/*.toml` — Gemini CLI command definitions
- `claude/commands/` — Claude Code slash commands
- `.cursor/rules/` — governance rules compiled into prompts
- `standards/` — reference docs synced to target projects
- `tooling/` — golden configs and manifests per stack
- `scripts/` — build, sync, sandbox, and prompt generation scripts
