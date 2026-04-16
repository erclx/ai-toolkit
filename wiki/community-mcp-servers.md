# Community MCP servers

Notable MCP servers worth installing with Claude Code. For the protocol itself, transports, scopes, and setup, see [Claude Code MCP](claude-mcp.md). Figures and maintenance notes are a snapshot from 2026-04-16 and drift fast. Re-verify before adding to a production config.

## At a glance

- Must-have for any project: [Context7](#context7-upstash)
- Must-have if you do UI work: [Playwright](#playwright-microsoft), [Chrome DevTools](#chrome-devtools-google)
- Must-have if you use the product: [Postgres MCP Pro](#postgres-mcp-pro), [Notion](#notion-official-hosted), [Atlassian](#atlassian-official-remote), [Google Workspace](#google-workspace-taylorwilsdon), [Microsoft 365](#microsoft-365-softeria)
- Nice-to-have: [Slack](#slack-korotovsky), [Sentry](#sentry-official-hosted)
- Niche: [Sequential Thinking](#sequential-thinking)
- Skip: [GitHub](#github-official-skip-for-most) in favor of `gh` CLI, Puppeteer in favor of Playwright, web search in favor of built-in

## Ecosystem caveats

Anthropic archived most first-party reference servers to [`modelcontextprotocol/servers-archived`](https://github.com/modelcontextprotocol/servers-archived) in May 2025, including Postgres, SQLite, GitHub, GitLab, Slack, Puppeteer, Brave Search, Google Drive, Google Maps, Sentry, and Redis. The archived Postgres server still ships roughly 21k weekly npm downloads despite an unpatched SQL injection ([Datadog Security Labs, 2025](https://securitylabs.datadoghq.com/articles/mcp-vulnerability-case-study-SQL-injection-in-the-postgresql-mcp-server/)). Check `servers-archived` before installing anything named `@modelcontextprotocol/server-*`.

Only six reference servers remain active: Everything, Fetch, Filesystem, Git, Memory, and Sequential Thinking. Filesystem and Git overlap with Claude Code's built-in file and shell tools.

The official registry at [`registry.modelcontextprotocol.io`](https://registry.modelcontextprotocol.io) launched in preview September 2025. It is a metaregistry holding metadata only. MCP moved to the Linux Foundation's Agentic AI Foundation in November 2025.

CLI beats MCP for some tasks. Microsoft's own Playwright MCP README recommends the CLI plus a Claude Code skill for high-throughput coding agents, because MCP tool schemas consume more context than a CLI invocation. The same holds for tools with established CLIs like `gh`, `aws`, and `kubectl`.

## Development

### Playwright (Microsoft)

[`microsoft/playwright-mcp`](https://github.com/microsoft/playwright-mcp) controls a real browser via the accessibility tree rather than screenshots, which is token-efficient and deterministic. Thirty-four tools cover navigation, clicks, form fills, screenshots, network inspection, and codegen across Chromium, Firefox, WebKit, and Edge. Apache-2.0, stdio or HTTP, very active. Must-have for any UI work.

Install with `claude mcp add playwright npx @playwright/mcp@latest`.

Caveats. Microsoft's README now recommends the Playwright CLI plus a Claude Code skill for long autonomous loops, because MCP tool schemas eat more context. A recent regression in 0.0.56 and later breaks tool discovery in Claude Code, so pin to 0.0.41 per [issue #1359](https://github.com/microsoft/playwright-mcp/issues/1359) and verify current status before installing. Do not confuse with `@executeautomation/playwright-mcp-server`, a separate community project with a different API.

### Chrome DevTools (Google)

[`ChromeDevTools/chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) complements Playwright rather than duplicating it. It exposes the full DevTools Protocol: performance traces, network inspection, source-mapped console messages, DOM and CSS inspection, and an `--autoConnect` flag that attaches to an already-open Chrome for debugging live sessions on Chrome 144 or later. Apache-2.0, stdio, public preview since September 2025. Must-have if you debug a frontend. Pair with Playwright for automation and debugging together.

Install with `claude mcp add chrome-devtools npx chrome-devtools-mcp@latest`. Opt out of Google's usage telemetry with `--no-usage-statistics`.

### Context7 (Upstash)

[`upstash/context7`](https://github.com/upstash/context7) fetches version-specific library docs into context on demand, which hedges against stale model knowledge. Two tools, `resolve-library-id` and `get-library-docs`, with filters for topic and version. Hosted at `https://mcp.context7.com/mcp` with a generous free tier. MIT, HTTP or stdio, very active. Must-have for any project that uses mainstream libraries.

Install with `claude mcp add --transport http context7 https://mcp.context7.com/mcp`. Trigger it by adding `use context7` to a prompt, or instruct `CLAUDE.md` to reach for it when library docs are needed. For libraries Context7 indexes poorly, an alternative is a subagent that clones the dependency repo and generates a task-specific manual ([Mario Zechner](https://mariozechner.at/posts/2025-08-15-mcp-vs-cli/)).

### Postgres MCP Pro

[`crystaldba/postgres-mcp`](https://github.com/crystaldba/postgres-mcp) replaces the archived `@modelcontextprotocol/server-postgres`. Do not install the archived one. It has an unpatched SQL injection. The replacement offers a read-only mode for production, index tuning with HypoPG hypothetical indexes, database health checks for buffer cache, bloat, vacuum, and replication, and EXPLAIN analysis. MIT, stdio or SSE. Active but slowing as of January 2026 after acquisition into Temporal Technologies. Watch for successor projects if activity stalls further.

For SQLite the reference server is also archived. Query SQLite directly via the `sqlite3` CLI through the built-in shell tool. A dedicated SQLite MCP is niche.

### GitHub (official, skip for most)

[`github/github-mcp-server`](https://github.com/github/github-mcp-server) is well-built with toolsets, read-only mode, lockdown mode, and Enterprise support. For Claude Code specifically the `gh` CLI usually consumes less context and produces better results, per practitioner benchmarks and Mario Zechner's [MCP-vs-CLI comparison](https://mariozechner.at/posts/2025-08-15-mcp-vs-cli/). Mention `gh` in `CLAUDE.md` and skip the MCP, unless the environment blocks `gh` or you need tight tool scoping via `--toolsets` and `--read-only` in an agentic loop.

### Sequential Thinking

[`modelcontextprotocol/servers`](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking) ships one tool that functions as a whiteboard where the model logs thoughts, revisions, and branches. The server is passive, all reasoning happens in the model. Claude already does structured chain-of-thought internally, especially with extended thinking, so the incremental value is modest. Worth installing if you run autonomous multi-step agents and want to inspect reasoning traces. MIT, stdio. Niche.

### Archived or redundant

- Puppeteer is archived. Use Playwright.
- Brave Search, Tavily, and Perplexity mostly duplicate Claude Code's built-in web search. Install one only for higher volume, specific search semantics like Brave's unfiltered index, or a cheaper API bill than metered Claude calls.

## Productivity

### Notion (official, hosted)

Hosted at `https://mcp.notion.com/mcp` with OAuth 2.1. Free with any Notion plan. Listed as an example in the [official Claude Code MCP docs](https://code.claude.com/docs/en/mcp). The docs format is LLM-optimized markdown with trimmed hierarchy. Must-have if you use Notion.

Install with `claude mcp add --transport http notion https://mcp.notion.com/mcp`.

The open-source `@notionhq/notion-mcp-server` still exists but Notion deprioritized it. Use it only for headless or CI flows where OAuth is impractical.

### Atlassian (official, remote)

[`atlassian/atlassian-mcp-server`](https://github.com/atlassian/atlassian-mcp-server) covers Jira, Confluence, and Compass via Atlassian Cloud. Hosted at `https://mcp.atlassian.com`. Respects the authenticated user's permissions, so the agent only sees what the user can see. Admin controls include domain allowlisting and IP restrictions. Must-have if you use Atlassian Cloud. Atlassian recommends migrating from the `/sse` path to `/mcp`, so check current docs.

### Google Workspace (taylorwilsdon)

[`taylorwilsdon/google_workspace_mcp`](https://github.com/taylorwilsdon/google_workspace_mcp) covers Gmail, Drive, Calendar, Docs, Sheets, Slides, Forms, Chat, Apps Script, Tasks, Contacts, and Search. Tool tiers `core`, `extended`, and `complete` limit the tool surface to save context. OAuth 2.1 with multi-user support means a team can host one instance. MIT, stdio or HTTP, weekly releases. No official Google Workspace MCP exists, so this is the de facto standard.

### Microsoft 365 (Softeria)

[`softeria/ms-365-mcp-server`](https://github.com/softeria/ms-365-mcp-server) covers Outlook, Calendar, OneDrive, Excel, OneNote, Planner, Contacts, Teams, and SharePoint via the Microsoft Graph API. Around 200 tools map one-to-one to Graph endpoints. Use `--preset` flags like `mail`, `calendar`, or `excel`, plus `--read-only`, to keep the tool surface manageable. An experimental `--discovery` mode reduces tools to two, search and execute. MIT, stdio or HTTP, active.

An alternative is [`Aanerud/MCP-Microsoft-Office`](https://github.com/Aanerud/MCP-Microsoft-Office), which splits 117 tools across three sub-servers to work around Claude Desktop's per-server tool limit and adds full PowerPoint and Word coverage. Evaluate it if slide creation matters.

Microsoft also ships a free cloud-hosted [Microsoft Learn Docs MCP](https://learn.microsoft.com/api/mcp). Think of it as Context7 for Azure and .NET.

### Slack (korotovsky)

[`korotovsky/slack-mcp-server`](https://github.com/korotovsky/slack-mcp-server) is the recommended community option among several that replaced the archived Anthropic reference. Fifteen tools including message search. Supports both bot tokens prefixed `xoxb-` and browser session tokens prefixed `xoxc` or `xoxd`, so usage does not require workspace admin approval. Writes are disabled by default, opt in with `SLACK_MCP_ADD_MESSAGE_TOOL`. MIT, stdio or SSE, very active. Nice-to-have.

[`zencoderai/slack-mcp-server`](https://github.com/zencoderai/slack-mcp-server) inherits Anthropic's reference with eight tools and writes enabled by default. Use only for bot-style access in a trusted workspace.

Slack also shipped an official remote MCP in 2025 covering a curated subset of the Web API behind Streamable HTTP. It requires a registered Slack app. Check Slack's current docs if you want the official path.

### Sentry (official, hosted)

Hosted at `https://mcp.sentry.dev` with OAuth. Query issues, projects, and error data in natural language. Free with any Sentry plan. Replaces the archived reference server. Nice-to-have for teams on Sentry.

### Discord

No dominant production-grade Discord MCP exists as of early 2026. Community options at [PulseMCP](https://www.pulsemcp.com) require bot-token setups with limited scope. Evaluate current options before recommending one.

## Honorable mentions

- Figma Dev Mode MCP is official and exposes selected-layer data for design-to-code workflows. Must-have if you build against Figma designs. See the [Figma integration note](community-skills.md#figma-mcp-and-code-to-canvas) in community skills.
- Firecrawl turns a website into clean LLM-ready markdown. Useful when the built-in web-fetch tool produces noisy output on content-heavy pages.
- The reference Filesystem server is redundant with Claude Code's built-in file tools in almost every case. Skip unless exposing file access to a non-Claude-Code client.
- The reference Memory server provides a knowledge-graph-backed memory. Evaluate whether it adds anything over Claude's native memory feature.
- Linear ships an official remote server. Add it if the team uses Linear.

## Registries and directories

- [`registry.modelcontextprotocol.io`](https://registry.modelcontextprotocol.io): Anthropic-backed metaregistry, canonical machine-readable source, not a discovery UX
- [`modelcontextprotocol/servers`](https://github.com/modelcontextprotocol/servers): six active reference servers plus Community and Official Integrations indexes
- [`modelcontextprotocol/servers-archived`](https://github.com/modelcontextprotocol/servers-archived): do-not-install list for deprecated references
- [PulseMCP](https://www.pulsemcp.com): around 12k servers, hand-reviewed, best curated discovery
- [Smithery](https://smithery.ai): around 7k servers with an app-store UI and hosted remote options
- [Glama](https://glama.ai/mcp/servers): broad automated coverage with visual previews
- [MCP.so](https://mcp.so): another broad directory
- [`punkpeye/awesome-mcp-servers`](https://github.com/punkpeye/awesome-mcp-servers): most active community awesome list
- [Claude Code plugin marketplace](https://claudecodemarketplace.com): plugins often bundle MCP servers with skills and slash commands

## Gotchas

1. Context cost. Each MCP server starts a subprocess and injects tool schemas into context. Cap active servers around five or six per project. Claude Code's Tool Search feature reduces this cost via lazy loading.
2. Archived does not mean broken. Archived reference servers still run, which is why they are dangerous. The Postgres SQL injection was known and unpatched while the npm package still shipped over 20k weekly downloads.
3. CLI-first mindset. For any tool with a well-known CLI like `gh`, `aws`, `kubectl`, `psql`, `sqlite3`, or `docker`, try mentioning the CLI in `CLAUDE.md` before reaching for an MCP. Microsoft itself now recommends this for Playwright in high-throughput agent loops.
4. Transport choice. Claude Code supports stdio for local, HTTP for remote, and SSE as a deprecated fallback. Prefer HTTP for remote servers per the [official MCP docs](https://code.claude.com/docs/en/mcp).
5. OAuth versus API tokens. Hosted servers like Notion, Atlassian, Sentry, and Slack official use OAuth and tie access to the signed-in user's permissions. Self-hosted servers usually need API keys or service credentials. Prefer read-only modes where available.
