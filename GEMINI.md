# AI Toolkit Context

AI Toolkit is a meta-extension for the Gemini CLI designed to enforce engineering governance and automate development workflows. It operates as a compiler system that transforms local markdown standards into executable agent commands.

## Architecture

- **Source of Truth:** Governance rules reside in `.cursor/rules/` and reference standards in `standards/` at the repository root.
- **Compiler:** `scripts/build-gov.sh` bundles these sources into context-aware `.toml` command definitions.
- **Distribution:** Compiled commands in `gemini/commands/` provide the runtime instructions for the Gemini CLI.

## Tech Stack

- **Runtime:** Gemini CLI
- **Package Management:** Bun (Node.js) / UV (Python)
- **Automation:** POSIX-compliant Shell scripts
- **Standards:** Conventional Commits, Semantic Versioning, and MDC (Markdown with Code)

## Operational Single Source of Truth

- **Command Definitions:** See `gemini/commands/**/*.toml`.
- **Governance Logic:** See `standards/` and `.cursor/rules/`.
- **Project Configuration:** See `gemini/gemini-extension.json`.
