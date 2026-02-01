# AI Core Toolkit

A high-fidelity Gemini extension for Senior Principal Architects. This toolkit provides automated reconnaissance, atomic commits, and evidence-based PR generation.

## Architecture: The Ghost Folder

This toolkit utilizes a **Ghost Folder** pattern to maintain project state without polluting your source code.

- **`.gemini/.tmp/`**: Acts as the "AI Brain."
- **Persistence**: While the AI session resets, the `scout-report.md` stored here ensures the agent retains "Architectural Memory" of your tech stack, versions, and gaps.
- **Security**: All temporary artifacts are strictly ignored via `.geminiignore`.

## Installation

1. git clone <repo_url>
2. gemini extensions link .

## Commands

- `/ai-toolkit.arch:scout` - Deep architectural reconnaissance to determine stack, intent, and health.
- `/ai-toolkit.git:commit` - Analyzes staged changes to generate a specific, conventional commit message.
- `/ai-toolkit.git:pr` - Generates a documentation-driven PR description and opens a draft.
- `/ai-toolkit.lint:spelling` - Agentic session to triage spellcheck errors and update dictionaries.
- `/ai-toolkit.setup:cspell` - Scaffold CSpell infrastructure, dictionaries, and scripts.
- `/ai-toolkit.setup:gemini` - Agentic session to scaffold Gemini configuration.
- `/ai-toolkit.write:changelog` - Generates a semantic changelog entry based on git history.

## Principles

1. **Document Reality**: We document what is actually in the code, not what we hope will be there.
2. **Signal over Noise**: Metadata is filtered to ensure the AI focuses on load-bearing architectural decisions.
3. **Idempotency**: All setup commands are safe to run multiple times.