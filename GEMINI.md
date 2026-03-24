# Toolkit context

CLI toolkit for managing AI workflows, developer standards, and project tooling across repositories.

## Key paths

- `gemini/commands/`: Gemini CLI command definitions
- `.cursor/rules/`: governance rules
- `standards/`: reference docs synced to target projects
- `tooling/`: golden configs and manifests per stack
- `snippets/`: reusable prompt snippets
- `prompts/`: system prompt generators
- `scripts/`: build, sync, sandbox, and prompt generation scripts

## Behavior

- For any command that produces a FINAL COMMAND block, always show PREVIEW first. Never run a command without it.
- If the user responds with a short affirmation or clearly signals intent to proceed, execute the FINAL COMMAND immediately without re-explaining or re-previewing.

## Spelling

- Add unknown words to the appropriate dictionary defined in `cspell.json`
- Keep dictionary files sorted alphabetically
