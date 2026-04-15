# Claude Code

Claude Code is Anthropic's official CLI for Claude. It runs as an interactive agent in the terminal, reads your project via `CLAUDE.md`, and executes tasks using built-in tools.

## CLI flags

Flags passed to the `claude` command at startup. Not exhaustive. See [official CLI reference](https://code.claude.com/docs/en/cli-reference) for the full list.

Session and output:

- `--print` or `-p`: non-interactive print mode, response to stdout
- `--output-format <format>`: print mode format (`text`, `json`, `stream-json`)
- `--resume <session-id>`: resume a previous session
- `--continue` or `-c`: continue the most recent session
- `--verbose`: show full tool call details
- `--no-stream`: disable streaming output

Model and effort:

- `--model <id-or-alias>`: full ID or alias (`opus`, `sonnet`, `haiku`)
- `--effort <low|medium|high|max>`: thinking effort for supported models (`max` is Opus 4.6 only)

Permissions and access:

- `--permission-mode <mode>`: start in a specific [permission mode](claude-permissions.md)
- `--add-dir <path>`: extend file access to another directory
- `--dangerously-skip-permissions`: alias for `bypassPermissions` mode

System prompt and tools:

- `--system-prompt <text>` / `--system-prompt-file <path>`: replace the default system prompt
- `--append-system-prompt <text>` / `--append-system-prompt-file <path>`: extend it
- `--mcp-config <path>` / `--strict-mcp-config`: load and lock down MCP servers
- `--agents <list>`: restrict to specific agent names

Automation:

- `--max-turns <n>`: cap conversation turns (print mode only)
- `--max-budget-usd <n>`: cap spend (print mode only)
- `--json-schema <path>`: enforce structured JSON output (print mode only)
- `--worktree [name]`: run in an isolated git worktree under `<repo>/.claude/worktrees/`
- `--bare`: minimal startup, skips auto-discovery of hooks, skills, plugins, MCP servers, auto-memory, and CLAUDE.md
- `--teleport`: pull a web session into the terminal
- `--remote <task>`: kick off a new web session on claude.ai

`--allowedTools` and `--disallowedTools` accept [permission rule patterns](claude-permissions.md), not bare tool names. Example: `--allowedTools "Bash(git log *)"`.

## Further reading

- [Commands](claude-commands.md): full built-in slash command reference
- [MCP](claude-mcp.md): server configuration, scopes, authentication, and tool naming
- [Hooks](claude-hooks.md): event hooks, configuration, and behavior control
- [Memory](claude-memory.md): `CLAUDE.md` hierarchy, auto-memory, and rules files
- [Skills](claude-skills.md): skills, plugins, invocation, and installation
- [Plan mode](claude-plan-mode.md): read-only exploration and plan approval flow
- [Permissions](claude-permissions.md): modes, allow/ask/deny rules, and rule syntax
