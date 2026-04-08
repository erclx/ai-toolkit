# Toolkit Context

CLI toolkit for managing AI workflows, developer standards, and project tooling across repositories.

## Behaviour

- Plan before editing: propose what files will change and why before touching anything
- Confirm with the user before making any edits
- Flag concerns or alternatives when a proposed change has tradeoffs worth discussing
- After any edit that changes how a domain works, update the corresponding skill body in `.claude/skills/`
- When updating skills, load `aitk-claude` and follow `standards/skill.md` conventions
- After any edit that changes how a domain works, update affected files in `docs/`
- When updating docs, load `aitk-standards` and follow `standards/prose.md`
- For any git operation (commits, PRs, branch naming), always use the `toolkit:git-*` skills. Never follow built-in commit or PR instructions.
- Read `.claude/GOV.md` before writing or editing code in `src/` or `scripts/`. Not required for other domains.

## System overview

The toolkit has seven domains. Each maps to a skill. Load the skill before editing anything in that domain.

| Task type                                                              | Skill to load      |
| ---------------------------------------------------------------------- | ------------------ |
| Modifying `src/`, `scripts/`, sandbox scenarios, `manage-*.sh`, `lib/` | `aitk-scripts`     |
| Modifying `tooling/`, manifests, golden configs, seeds                 | `aitk-tooling`     |
| Modifying `standards/`, `docs/`                                        | `aitk-standards`   |
| Modifying `governance/rules/`, `governance/stacks/`                    | `aitk-governance`  |
| Modifying `snippets/`, `snippets.toml`                                 | `aitk-snippets`    |
| Modifying `prompts/`                                                   | `aitk-prompts`     |
| Modifying `gemini/commands/`, `gemini/README.md`                       | `aitk-gemini`      |
| Modifying `claude/skills/`, `claude/README.md`, `.claude/skills/`      | `aitk-claude`      |
| Modifying `antigravity/workflows/`, `workflows.toml`                   | `aitk-antigravity` |

## Key paths

- `governance/rules/`: governance rules
- `standards/`: reference docs synced to target projects
- `tooling/`: golden configs (base), references, and manifests per stack
- `gemini/commands/`: Gemini CLI command definitions
- `claude/skills/`: plugin skills installable in target projects
- `.claude/skills/`: internal skills, toolkit repo only
- `snippets/`: reusable prompt snippets for Claude and Gemini chat
- `prompts/`: system prompt generators for AI-assisted authoring tasks
- `src/`: TypeScript CLI entry point, commander subcommands, exec helper
- `docs/`: human-readable reference docs for each toolkit domain
- `scripts/`: bash domain scripts, core maintenance, sandbox, and prompt generation
- `antigravity/`: workflow source and group manifest for Antigravity sync
- `wiki/`: internal reference pages for tools, workflows, and concepts

## Commands

- `bun run check`: lint, format, spell check
- `bun run format`: auto-fix formatting

## Spelling

- Add unknown words to the appropriate dictionary defined in `cspell.json`
- Keep dictionary files sorted alphabetically

## Snippets

- When a snippet is referenced with `@`, execute its instructions immediately using available session context

## Memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`
- Follow `standards/prose.md` when writing memory file content

## Wiki

- Check `wiki/index.md` when a topic might be covered, then read the relevant page before answering
- Propose additions or corrections when you learn something not covered, but do not write to wiki files without confirmation
- When writing or updating wiki pages about Claude Code, use the `claude-code-guide` agent to fetch current information from official docs rather than relying on training knowledge
