# Claude Code

Claude Code is Anthropic's official CLI for Claude. It runs as an interactive agent in the terminal, reads your project via `CLAUDE.md`, and executes tasks using built-in tools.

## CLI flags

Flags passed to the `claude` command at startup.

- `--model <id>`: set the model (e.g. `claude-opus-4-6`, `claude-sonnet-4-6`)
- `--print` or `-p`: run in non-interactive print mode, output response to stdout
- `--output-format <format>`: set output format in print mode (`text`, `json`, `stream-json`)
- `--resume <session-id>`: resume a previous session
- `--continue` or `-c`: continue the most recent session
- `--verbose`: show full tool call details
- `--no-stream`: disable streaming output
- `--allowedTools <tools>`: comma-separated list of tools to allow
- `--disallowedTools <tools>`: comma-separated list of tools to block
- `--add-dir <path>`: add an additional directory to the allowed file access list
- `--dangerously-skip-permissions`: skip all permission prompts (use with caution)

## Further reading

- [Commands](claude-commands.md): full built-in slash command reference
- [MCP](claude-mcp.md): server configuration, scopes, authentication, and tool naming
- [Hooks](claude-hooks.md): event hooks, configuration, and behavior control
- [Memory](claude-memory.md): `CLAUDE.md` hierarchy, auto-memory, and rules files
- [Skills](claude-skills.md): skills, plugins, invocation, and installation
- [Plan mode](claude-plan-mode.md): read-only exploration and plan approval flow
- [Permissions](claude-permissions.md): modes, allow/ask/deny rules, and rule syntax
