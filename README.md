# AI Core Toolkit

A high-fidelity Gemini extension for Senior Principal Architects. This toolkit provides automated reconnaissance, atomic commits, and evidence-based PR generation.

## Architecture: The Ghost Folder

This toolkit utilizes a **Ghost Folder** pattern to maintain project state without polluting your source code.

* **`.gemini/.tmp/`**: Acts as the "AI Brain."
* **Persistence**: While the AI session resets, the `scout-report.md` stored here ensures the agent retains "Architectural Memory" of your tech stack, versions, and gaps.
* **Security**: All temporary artifacts are strictly ignored via `.geminiignore`.

## Installation

1. git clone <repo_url>
2. gemini extensions link .

## Commands

* `/gemini-cli-toolkit.setup:gemini` - Scaffold project infrastructure and security rules.
* `/gemini-cli-toolkit.agent:scout` - Perform deep architectural reconnaissance and audit.

* `/gemini-cli-toolkit.git:commit` - Generate semantic, conventional commit messages.
* `/gemini-cli-toolkit.git:pr` - Create documentation-driven PR drafts.

## Principles

1. **Document Reality**: We document what is actually in the code, not what we hope will be there.
2. **Signal over Noise**: Metadata is filtered to ensure the AI focuses on load-bearing architectural decisions.
3. **Idempotency**: All setup commands are safe to run multiple times.