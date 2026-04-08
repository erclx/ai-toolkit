# Toolkit context

CLI toolkit for managing AI workflows, developer standards, and project tooling across repositories.

## Key paths

- `gemini/commands/`: Gemini CLI command definitions
- `governance/rules/`: governance rules
- `standards/`: reference docs synced to target projects
- `tooling/`: golden configs and manifests per stack
- `snippets/`: reusable prompt snippets
- `prompts/`: system prompt generators
- `docs/`: human-readable reference docs for each toolkit domain
- `scripts/`: build, sync, sandbox, and prompt generation scripts
- `antigravity/`: workflow source and group manifest for Antigravity sync
- `wiki/`: internal reference pages for tools, workflows, and concepts

## Behavior

- For any command that produces a FINAL COMMAND block, always show PREVIEW first, then immediately call the shell tool to execute it. Do not wait for a follow-up message.

## Spelling

- Add unknown words to the appropriate dictionary defined in `cspell.json`
- Keep dictionary files sorted alphabetically
