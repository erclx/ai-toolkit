# AI Toolkit Context

AI Toolkit is a meta-extension for the Gemini CLI designed to enforce engineering governance and automate development workflows. It operates as a compiler system that transforms local markdown standards into executable agent commands.

## Architecture

- **Source Assets:** Governance rules reside in `scripts/assets/cursor/rules/` and reference docs in `scripts/assets/docs/`.
- **Compiler:** `scripts/build-gov.sh` bundles these assets into context-aware `.toml` command definitions.
- **Distribution:** Compiled commands in `commands/` provide the runtime instructions for the Gemini CLI.

## Tech Stack

- **Runtime:** Gemini CLI
- **Package Management:** Bun (Node.js) / UV (Python)
- **Automation:** POSIX-compliant Shell scripts
- **Standards:** Conventional Commits, Semantic Versioning, and MDC (Markdown with Code)

## Operational Single Source of Truth

- **Command Definitions:** See `commands/**/*.toml`.
- **Governance Logic:** See `docs/` and `.cursor/rules/`.
- **Project Configuration:** See `gemini-extension.json`.
