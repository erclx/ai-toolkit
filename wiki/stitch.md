---
title: Stitch
description: Google's Gemini-powered design product, its MCP server, and how it fits the toolkit's tier 1 slot
---

# Stitch

[Stitch](https://stitch.withgoogle.com) is Google's AI design product, powered by Gemini 3 Flash and Gemini 3.1 Pro Thinking. It generates web and mobile UI from text prompts, with a remote MCP server for agent-driven design.

Stitch is the toolkit's default tier 1 pick because the MCP server makes it agent-addressable at no per-call quota cost. For where it sits in the broader framework, see [visual design workflow](visual-design-workflow.md).

## Status

Beta. Free tier with 400 daily credits plus 15 daily Redesign credits, refreshed every 24 hours. A single `generate_screen_from_text` call produces a design system, any AI-generated images, and the screen itself, costing around 5 credits in total. That is roughly 80 full generations per day at observed cost.

Hosted web app at `stitch.withgoogle.com`. Remote MCP server at `stitch.googleapis.com/mcp`. API keys are generated on the Settings page. `Allow AI model training` is opt-in by default, disable it on the Settings page before running prompts that contain proprietary content.

## Capabilities

### Input surfaces

- Text prompts in the conversational editor
- Image attachments, required for `Redesign` mode
- No codebase upload. Context is provided as prose in the prompt.

### Output formats

Per-frame export is reached via right-click or the `Export` action. Formats, as of 2026-04-18:

- `AI Studio`, push to Google AI Studio for further prompting
- `Figma`, push as editable Figma frames
- `Jules`, push to Google's AI coding agent
- `.zip`, project archive download
- `Code to Clipboard`, direct HTML, CSS, and JS paste
- `MCP`, associates the frame with the MCP client context
- `Project Brief`, structured spec document for coding agents
- `Instant Prototypes`, one-click linked prototype from a single frame

The presence of `Figma` and `MCP` export paths sets Stitch apart from Claude Design's single-target handoff tarball.

### Per-frame actions

Right-click on any frame surfaces an action menu:

- Generate: `Instant Prototype`, `Regenerate`, `Mobile App Version`, `Predictive Heatmap`, `Variants`
- Edit: `Edit`, `Annotate`, `Design System`
- Preview: `New Tab`, `Show QR Code`, viewport presets at `Mobile 390x884`, `Tablet 768x1024`, `Desktop 1280x1024`
- Inspect: `Show Connections`, `View Code`

`Predictive Heatmap` and `Mobile App Version` are Stitch-specific, no Claude Design equivalent.

### Target platforms

A toggle on the prompt box switches between `App` for native mobile and `Web` for browser UI. Stitch defaults to `App`, so select `Web` before submitting a web prompt.

### Design modes

The prompt-box selector picks the generation engine. UI modes as of 2026-04-18:

- `Thinking with 3 Pro`, Gemini 3 Pro, reasoning-heavy designs
- `Redesign`, Nano Banana Pro, requires a screenshot attachment, draws from the separate 15-credit daily bucket
- `2.5 Pro`, Gemini 2.5 Pro, high-fidelity HTML output
- `Fast`, optimized for quick wireframes and Figma export

The MCP `modelId` enum is narrower. Only `GEMINI_3_FLASH` (default) and `GEMINI_3_1_PRO` are exposed to MCP callers. `GEMINI_3_PRO` is deprecated. `Redesign` has no MCP-addressable equivalent.

## Design system representation

Stitch positions DESIGN.md as a peer of README.md and AGENTS.md. README is written for humans, AGENTS.md for coding agents, DESIGN.md for design agents that generate UI.

Inside Stitch, a design system carries two parallel surfaces, both visible in the design system editor:

- **Theme tokens**, structured fields under the `Theme` tab. The MCP `DesignTheme` schema is tight: `colorMode` (LIGHT or DARK), a seed `customColor` hex, a `colorVariant` picked from nine Material You presets, optional hex overrides for primary, secondary, tertiary, and neutral, three font roles (headline, body, label) chosen from a 29-name font enum, and `roundness` (ROUND_FOUR, ROUND_EIGHT, ROUND_TWELVE, ROUND_FULL). These drive rendering.
- **DESIGN.md prose**, free-text markdown under the `DESIGN.md` tab, stored as `designMd` on the same theme object. Documentation layer.

The two surfaces sit side by side. Stitch's own UI warns: `Changes to this file will not update theme variables or the design system preview on canvas in real time.`

Implication for any MCP caller updating a design system: push both. `update_design_system` with prose only leaves the rendered output unchanged, because Stitch keeps using the stored theme tokens.

## Stitch via MCP

The MCP server is the integration point that matters for the toolkit. It exposes a compact tool surface covering projects, screens, generation, and design systems.

### Tools

- Project: `create_project`, `get_project`, `list_projects`
- Screen: `list_screens`, `get_screen`
- Generation: `generate_screen_from_text`, `edit_screens`, `generate_variants`
- Design system: `create_design_system`, `update_design_system`, `list_design_systems`, `apply_design_system`

A coding agent with this tool set can provision a design system from prose, generate screens against it, edit them in place, and fan out variants, all without touching the web UI.

`generate_variants` accepts a `variantCount` of 1 to 5 (default 3), a `creativeRange` of `REFINE`, `EXPLORE`, or `REIMAGINE`, and optional `aspects` to constrain changes to `LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, or `TEXT_CONTENT`.

### Authentication

Two supported methods. Pick based on environment.

- **API Key**, persistent, fastest to set up, single header `X-Goog-Api-Key`. Generated on the Settings page. Do not commit to source control.
- **OAuth via gcloud ADC**, session-based, access token rotates every hour, required in zero-trust environments. Needs `gcloud auth login`, `gcloud auth application-default login`, and manual token refresh in the MCP client config each hour.

### Claude Code setup

API key flow, one-liner:

```plaintext
claude mcp add stitch --transport http https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: <key>" -s user
```

Full setup instructions including OAuth for Cursor, Antigravity, VSCode, and Gemini CLI are in the [upstream docs](https://stitch.withgoogle.com/docs/mcp/setup/). Tool schemas live in the MCP reference linked from the same page.

### TypeScript SDK

Google ships [`@google/stitch-sdk`](https://www.npmjs.com/package/@google/stitch-sdk) on npm for direct TypeScript access to the MCP surface. The `/ai` subpath exports `stitchTools()` for use with the Vercel AI SDK. Useful for scripts that bypass an MCP client entirely.

## How to use it with the toolkit

Stitch without context produces generic SaaS output. To get brand-accurate results, feed it a design system derived from the project itself.

The intended workflow is prose-first:

1. Curate `.claude/DESIGN.md` with voice, palette, spacing, components, and iconography. Write sentences, not JSON.
2. Call `create_design_system` via MCP, passing the extracted content as the `designSystem` payload.
3. Call `generate_screen_from_text` with a prompt that references the system by name.
4. Iterate with `edit_screens` or `generate_variants` as needed.

A planned `aitk design` CLI surface will wrap these calls. Until it exists, drive the MCP calls directly from a Claude Code session.

## When to use Stitch

Pick Stitch when:

- The project is tier 1 or tier 2 and the work is agent-driven
- Daily visual iteration is expected and Claude Design's weekly quota would bottleneck
- A Claude Code session is the author, either via MCP directly or through a toolkit skill
- The target is a web or mobile UI that Stitch supports natively

Skip Stitch when:

- You need codebase extraction on a repo without explicit brand material. Claude Design extracts from raw source, Stitch does not.
- The artifact is a slide deck, one-pager, or printable handoff. Stitch is UI-only.
- The team needs a polished handoff bundle with chat history for implementation. Claude Design's tarball carries more context than Stitch's export.

## Limitations

- **No codebase upload.** Context must be prose in the prompt, so brand fidelity is a function of prose quality.
- **Mobile-first defaults.** The prompt box starts in `App` mode. Switch to `Web` for web prompts.
- **First-pass fidelity is generic without a design system.** Always provision a design system first, via MCP or the web UI.
- **Training opt-in is the default.** Uncheck `Allow AI model training` in Settings before running prompts with sensitive content.
- **OAuth access tokens expire hourly.** Long-running integrations using OAuth must refresh tokens every hour, API keys avoid this.
- **Design systems via MCP may be project-scoped.** The web UI stores them org-wide, the MCP contract lists `projectId` on `create_design_system`. Verify before depending on cross-project reuse.

## References

- [Stitch home](https://stitch.withgoogle.com)
- [Stitch MCP setup](https://stitch.withgoogle.com/docs/mcp/setup/)
- [Visual design workflow](visual-design-workflow.md): tier framework that places Stitch as the tier 1 default
- [Claude Design](claude-design.md): the ceiling alternative when codebase extraction or the polished handoff matters
- [Community MCP servers](community-mcp-servers.md): where other first-party and third-party MCP servers are catalogued
