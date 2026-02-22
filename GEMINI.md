# AI Toolkit Context

A compiler system that transforms local markdown governance rules into executable Gemini CLI commands. Source rules and standards are authored once, compiled into `.toml` command definitions, and distributed to target projects.

## How It Works

- **Sources:** `.cursor/rules/` (governance rules) and `standards/` (reference docs) are the source of truth
- **Compiler:** `scripts/build-gov.sh` bundles sources into `.toml` artifacts and auto-commits them
- **Commands:** `gemini/commands/` contains the compiled runtime commands for the Gemini CLI
- **Sandbox:** `scripts/sandbox/` provides isolated test scenarios for each command

## Key Paths

- `gemini/commands/**/*.toml` — command definitions
- `standards/` — reference docs injected as agent context
- `.cursor/rules/` — governance rules compiled into prompts
- `scripts/templates/` — master prompt templates (cli + chat)
- `tooling/` — golden configs and manifests per stack
