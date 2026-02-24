# AI Toolkit Context

A compiler system that transforms governance rules into executable Gemini CLI commands. Rules are authored once, compiled into `.toml` command definitions, and distributed to target projects. Standards sync directly as plain markdown files.

## How It Works

- **Sources:** `.cursor/rules/` (governance rules) and `standards/` (reference docs) are the source of truth
- **Compiler:** `scripts/build-gov.sh` bundles rules into `rules.toml` and auto-commits the artifact
- **Commands:** `gemini/commands/` contains the compiled runtime commands for the Gemini CLI
- **Sandbox:** `scripts/sandbox/` provides isolated test scenarios for each command

## Key Paths

- `gemini/commands/**/*.toml` — command definitions
- `standards/` — reference docs injected as agent context
- `.cursor/rules/` — governance rules compiled into prompts
- `scripts/templates/` — master prompt templates (cli + chat)
- `tooling/` — golden configs and manifests per stack
