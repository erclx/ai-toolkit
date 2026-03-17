# Toolkit Context

CLI toolkit for managing AI workflows, developer standards, and project tooling across repositories.

## Behaviour

- Plan before editing: propose what files will change and why before touching anything
- Confirm with the user before making any edits
- Flag concerns or alternatives when a proposed change has tradeoffs worth discussing
- After any edit that changes how a domain works, update the corresponding skill body in `.claude/skills/`
- After any edit, update affected README and docs files following `standards/prose.md`

## System overview

The toolkit has seven domains. Each maps to a skill. Load the skill before editing anything in that domain.

| Task type                                                      | Skill to load     |
| -------------------------------------------------------------- | ----------------- |
| Modifying `scripts/`, sandbox scenarios, `manage-*.sh`, `lib/` | `aitk-scripts`    |
| Modifying `tooling/`, manifests, golden configs, seeds         | `aitk-tooling`    |
| Modifying `standards/`, `docs/`                                | `aitk-standards`  |
| Modifying `.cursor/rules/`, `.cursor/stacks/`                  | `aitk-governance` |
| Modifying `snippets/`, `snippets.toml`                         | `aitk-snippets`   |
| Modifying `prompts/`                                           | `aitk-prompts`    |
| Modifying `gemini/commands/`, `gemini/README.md`               | `aitk-gemini`     |
| Modifying `claude/skills/`, `claude/README.md`                 | `aitk-claude`     |

## Key paths

- `.cursor/rules/`: governance rules
- `standards/`: reference docs synced to target projects
- `tooling/`: golden configs and manifests per stack
- `gemini/commands/`: Gemini CLI command definitions
- `claude/skills/`: plugin skills installable in target projects
- `.claude/skills/`: internal skills, toolkit repo only
- `snippets/`: reusable prompt snippets for Claude and Gemini chat
- `prompts/`: system prompt generators for AI-assisted authoring tasks
- `scripts/`: build, sync, sandbox, and prompt generation scripts

## Commands

- `bun run check`: lint, format, spell check
- `bun run format`: auto-fix formatting
- `bun run clean`: remove generated artifacts
