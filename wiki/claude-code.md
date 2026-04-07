# Claude Code

Claude Code is Anthropic's official CLI for Claude. It runs as an interactive agent in the terminal, reads your project via `CLAUDE.md`, and executes tasks using a set of built-in tools.

## Built-in slash commands

See [Claude Code commands](claude-commands.md) for the full reference.

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

## CLAUDE.md

`CLAUDE.md` is the project instruction file Claude reads at session start. It sets context, defines conventions, and controls behavior. Claude reads all `CLAUDE.md` files found in the directory tree, from root down to the current working directory.

Place project-specific instructions in the root `CLAUDE.md`. Subdirectory `CLAUDE.md` files apply only when Claude is working in that subtree.

## Hooks

Hooks are shell commands that run in response to Claude Code events. Configure them in `settings.json` under the `hooks` key. Claude does not execute hooks directly. The harness does.

Common hook events:

- `PreToolUse`: runs before a tool call
- `PostToolUse`: runs after a tool call
- `Notification`: runs when Claude sends a notification
- `Stop`: runs when the session ends

## Memory

Claude Code has a persistent memory system. Memory files live in `~/.claude/projects/<project-hash>/` by default. Use `CLAUDE.md` to redirect memory to a project-local path (e.g. `.claude/memory/`).

The memory system uses an index file (`MEMORY.md`) that Claude loads each session, plus individual topic files it reads on demand.

## MCP servers

MCP (Model Context Protocol) adds external tools and data sources to Claude Code. Configure servers in `settings.json` under the `mcpServers` key. Each server exposes tools that appear alongside built-in tools in the session.

## Settings

`settings.json` lives at `~/.claude/settings.json` (user-level) or `.claude/settings.json` (project-level). Project settings take precedence over user settings. Key fields:

- `model`: default model
- `hooks`: event hooks configuration
- `mcpServers`: MCP server definitions
- `permissions`: tool allow/deny lists
