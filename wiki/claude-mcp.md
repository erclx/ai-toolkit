# Claude Code MCP

MCP (Model Context Protocol) connects external tools and data sources to Claude Code. Each server exposes tools, prompts, and resources that appear alongside built-in tools in the session.

## Adding servers

Use `claude mcp add` to register a server. The `--transport` flag sets the connection type.

**HTTP** (recommended for remote servers):

```plaintext
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

**SSE** (deprecated, use HTTP where available):

```plaintext
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

**Stdio** (local servers):

```plaintext
claude mcp add --transport stdio --env API_KEY=value myserver -- npx @org/mcp-server
```

Pass environment variables with `--env` before the server name. On Windows, wrap the command: `cmd /c npx ...`.

## Configuration scopes

Servers are stored at three scopes. Use `--scope` to specify.

- `local` (default): stored in project-local config. Personal or sensitive per-project servers. Not shared.
- `project`: stored in `.mcp.json` at the project root. Checked into source control and shared with the team. Claude Code prompts for approval before using servers from this file.
- `user`: stored in `~/.claude.json`. Personal utilities available across all projects.

Local overrides project when the same server name exists at both scopes.

Project scope config format:

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp"
    }
  }
}
```

Reset project approval choices with `claude mcp reset-project-choices`.

## Authentication

HTTP servers that require OAuth trigger a browser-based flow automatically. Claude Code handles dynamic client registration by default.

For servers with a pre-registered redirect URI, fix the callback port:

```plaintext
claude mcp add --transport http --callback-port 8080 myserver https://mcp.example.com/mcp
```

To use pre-configured credentials:

```plaintext
claude mcp add --transport http --client-id your-id --client-secret --callback-port 8080 myserver https://mcp.example.com/mcp
```

Use `/mcp` in a session and select a server to authenticate or revoke access.

## Tool and prompt naming

MCP tools follow the format `mcp__<servername>__<toolname>`. Use this format in permission rules:

```json
{
  "permissions": {
    "allow": ["mcp__github__list_prs"],
    "deny": ["mcp__github__*"]
  }
}
```

MCP prompts appear as slash commands: `/mcp__<servername>__<promptname>`. They show up in the `/` command menu and work the same as built-in commands.

## Resources

Type `@` in a prompt to see available resources from connected servers. Resources are fuzzy-searchable and auto-fetched as attachments when referenced.

## /mcp command

Run `/mcp` in a session to list connected servers, authenticate with remote servers, and manage connections. Plugin-provided servers appear here alongside manually configured ones.
