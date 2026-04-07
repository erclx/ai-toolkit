# Claude Code permissions

Claude Code evaluates every tool call against permission rules before executing. Rules are checked in order: deny beats ask beats allow. The first match wins.

## Permission modes

Set the active mode with `--permission-mode <mode>` or `permissions.defaultMode` in `settings.json`.

- `default`: prompts before writes and shell commands. Reads are approved on first encounter per session
- `acceptEdits`: auto-approves file edits. Still prompts for bash, network requests, and protected paths
- `plan`: reads and explores only. Proposes changes without executing them. See [plan mode](claude-plan-mode.md)
- `auto`: auto-executes with a background safety classifier that blocks escalations and injection attempts. Team and Enterprise only
- `bypassPermissions`: all operations execute immediately except writes to protected paths. Use only in isolated containers

`--dangerously-skip-permissions` is an alias for `bypassPermissions`.

## Allow, ask, and deny rules

Configure rules in `settings.json` under `permissions.allow`, `permissions.ask`, and `permissions.deny`.

```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": ["Bash(npm run build)", "Bash(git commit *)", "Edit(/src/**)"],
    "deny": ["Bash(git push *)", "Edit(.env)"]
  }
}
```

## Rule syntax

Rules follow the format `Tool` or `Tool(specifier)`. Omit the specifier to match all uses of a tool.

**Bash specifiers** match command strings with glob support:

- `Bash(npm run build)`: exact match
- `Bash(npm run test *)`: command plus any arguments
- `Bash(git * main)`: any git subcommand targeting main

**File specifiers** use gitignore-style patterns with path roots:

- `Edit(/src/**/*.ts)`: relative to project root
- `Edit(./.env)`: relative to working directory
- `Edit(~/.zshrc)`: relative to home directory
- `Read(//etc/hosts)`: absolute path (double slash)

**Other tools:**

- `WebFetch(domain:example.com)`: match by domain
- `mcp__servername__toolname`: specific MCP tool
- `mcp__servername__*`: all tools from an MCP server

## Protected paths

These paths always prompt regardless of mode or rules:

- `.git`, `.claude`, `.vscode`, `.idea`, `.husky`
- `.gitconfig`, `.gitmodules`, `.bashrc`, `.zshrc`, `.zprofile`, `.profile`

## Precedence

Deny rules at any level block execution. Allow rules at lower levels cannot override denies at higher levels. Settings load in this order, with earlier entries taking precedence: managed policy, CLI args, `.claude/settings.local.json`, `.claude/settings.json`, `~/.claude/settings.json`.
