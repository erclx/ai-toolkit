---
title: Visual wireframes
description: Tooling research for a visual companion to the ASCII wireframe seed
---

# Visual wireframes

The toolkit's `WIREFRAMES.md` seed is ASCII only. That works for structure but blocks visual feedback. Claude cannot critique its own layouts because it only sees the grid it typed, and a human reviewer cannot judge color, hierarchy, or proportion from ASCII. This page records the tooling research for an opt-in visual companion that would sit alongside the ASCII file.

## Status

Deferred. The recommendation below stands. The operational cost only pays off on UI projects complex enough to justify a per-project canvas server and MCP shim, so integration waits for a real candidate project. Anyone who wants it sooner can follow the setup sketch below.

## Candidates

- **Mermaid**: text-based, free, MIT-licensed. Renders in GitHub and many viewers. Eliminated because layout is algorithmic. There is no spatial primitive for "nav bar at top, sidebar left, content right at 60% width." Strong for flows and sequences but unsuitable as a wireframe canvas.
- **draw.io and diagrams.net**: open XML, Apache 2.0. An LLM can read the format but the schema is verbose enough that authoring is brittle. No maintained MCP integration. Eliminated.
- **Figma**: ruled out on cost. The relevant capabilities sit behind paid tiers and an auth wall. No local-first story.
- **tldraw**: open source with first-party AI integration targeting a hosted product. No maintained MCP server for local file tooling. Heavier schema than Excalidraw. Eliminated for this use case.
- **Excalidraw**: MIT-licensed, hand-drawn aesthetic, plaintext JSON file format. A maintained community MCP server gives an agent a full canvas toolkit with the ability to inspect what it drew. Selected.
- **Stitch**: free, from Google Labs, AI-native design canvas with direct `DESIGN.md` export and a Stitch MCP server. Eliminated as a wireframe companion because output is design system documentation, not spatial layout geometry. Relevant to the `.claude/DESIGN.md` seed instead. See [Google Stitch and DESIGN.md](community-skills.md#google-stitch-and-designmd) in community skills.

## Recommendation

Use [Excalidraw](https://github.com/excalidraw/excalidraw) with the community MCP server [`yctimlin/mcp_excalidraw`](https://github.com/yctimlin/mcp_excalidraw). The community server fits an agent that builds, inspects, and revises a persisted canvas file. The official [`excalidraw/excalidraw-mcp`](https://github.com/excalidraw/excalidraw-mcp) server targets one-shot inline rendering in chat clients and is the wrong tool for a workflow where the agent needs to read back its own output.

The decisive properties:

- **Format**: a scene is an array of typed JSON elements with explicit `x`, `y`, `width`, `height`, stroke, fill, and label fields. No binary encoding, no implicit layout state. Round-trips through an LLM without semantic loss.
- **Feedback loop**: `describe_scene` returns structured element data, `get_canvas_screenshot` returns a rendered image. The agent can verify spatial relationships before claiming the render is correct.
- **License**: MIT for both Excalidraw and the community MCP server.
- **Footprint**: Node 18+, a canvas server on `localhost:3000`, and the stdio MCP process. Heavier than markdown, lighter than a Figma account.

## How it sits alongside the ASCII doc

`WIREFRAMES.md` stays the source of truth. It holds the surface inventory, state variants, copy, and annotations. The agent authors there first.

`WIREFRAMES.excalidraw` is the derived visual. The agent translates the ASCII grid into Excalidraw JSON: each ASCII region becomes a named rectangle with explicit coordinates, text elements carry copy verbatim from the markdown, annotations become muted text elements. The file lives in the same directory as `WIREFRAMES.md` and is committed.

Sync is one-way by default, markdown to Excalidraw, triggered explicitly when the agent is asked to render. Human edits on the canvas are review annotations, not feedback that writes back to markdown. A marker like `<!-- excalidraw: WIREFRAMES.excalidraw -->` at the top of `WIREFRAMES.md` opts a project in. Projects that omit it stay on ASCII only.

## Setup sketch

Two processes run locally: the Excalidraw canvas server and the MCP stdio shim that proxies to it. Register with Claude Code at project scope so the integration is opt-in per repo.

```bash
claude mcp add excalidraw --scope project \
  -e EXPRESS_SERVER_URL=http://localhost:3000 \
  -e ENABLE_CANVAS_SYNC=true \
  -- node /path/to/mcp_excalidraw/dist/index.js
```

The `yctimlin/mcp_excalidraw` README recommends building from source over the NPM package, which is still stabilizing.

## Known footguns

- **Auto-sync element doubling**: the canvas frontend periodically pushes the full scene to the server. Bound text elements get re-injected, producing duplicates. Mitigation: keep labels as free-standing text elements, not attached to background rectangles. Call `snapshot_scene` before bulk writes.
- **Coordinate convention**: Excalidraw uses arbitrary pixel units. Without a reference grid the agent produces inconsistent layouts. Encode a convention in the seed and load it into the agent's context on each render. Example: 1 ASCII column equals 10px, surfaces start at `y=0` with 50px gaps.
- **Arrow ID stability**: arrows reference element IDs by string. Recreating an element assigns a new ID and orphans every arrow that pointed at it. Verify IDs with `get_element` before binding. Prefer `import_scene` over piecemeal element creation when rebuilding.
- **Canvas server liveness**: the MCP shim assumes the canvas process is up. If it is not, tool calls fail unhelpfully. Any automation needs a health check before invoking MCP tools.
- **Cloud export**: `export_to_excalidraw_url` uploads to `excalidraw.com`. Use `export_scene` to a local file instead, never the URL export.

## References

- [`yctimlin/mcp_excalidraw`](https://github.com/yctimlin/mcp_excalidraw): community MCP server with full canvas toolkit
- [`excalidraw/excalidraw-mcp`](https://github.com/excalidraw/excalidraw-mcp): official MCP server for inline rendering in chat clients
- [Excalidraw JSON schema](https://docs.excalidraw.com/docs/codebase/json-schema)
- [DevelopersIO walkthrough for Claude Code with Excalidraw MCP](https://dev.classmethod.jp/en/articles/excalidraw-mcp-claude-code/)
- [Mastra post on whiteboard-to-Excalidraw round-tripping](https://mastra.ai/blog/whiteboard-to-excalidraw-converter)
