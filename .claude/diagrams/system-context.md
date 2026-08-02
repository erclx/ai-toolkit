---
title: System context
description: Who the toolkit serves and what it publishes to, drawn from REQUIREMENTS.md
category: System context
---

# System context

Who reaches for the toolkit, and which systems carry its output to them.

```mermaid
flowchart TB
  accTitle: Who uses the toolkit and what it talks to
  accDescr: A maintainer authors conventions inside the toolkit boundary, which publishes a CLI to a package registry and lists a plugin on a marketplace, and a developer running Claude Code pulls from both to write those conventions into a repository of their own.

  maintainer["Maintainer"]

  subgraph aitk["aitk"]
    content["Authored conventions"]
    cli["aitk CLI"]
    plugin["Claude Code plugin"]
  end

  npm["npm registry"]
  market["Plugin marketplace"]
  dev["Developer with Claude Code"]
  repo["Target repository"]

  maintainer -->|authors| content
  content --> cli
  content --> plugin
  cli -->|published to| npm
  plugin -->|listed on| market
  npm --> dev
  market --> dev
  dev -->|installs and syncs| repo
```

The toolkit is a store of conventions written as text. Governance rules, prose standards, seed planning documents, and Claude Code workflow skills all live here as markdown and configuration rather than as a library a project imports. The problem it addresses is repetition. A team that re-authors the same rules in every repository ends up with copies that drift apart, and an agent working across those repositories can no longer rely on a consistent signal.

Two channels carry that content outward, and they are independent. The CLI publishes to the npm registry under `@erclx/aitk`, which a developer installs like any other command line tool. The plugin is listed on a Claude Code marketplace, which loads its skills into a session directly from this repository. A developer usually takes both, because the skills call the CLI rather than reimplementing what it does.

The boundary ends at the developer's machine. Nothing here runs as a hosted service, and the toolkit ships no runtime code into a target project. It writes files into that project and then steps out of the way, which is why the last edge points from the developer rather than from the toolkit. Scope, goals, and the explicit non-goals behind that choice are recorded in `.claude/REQUIREMENTS.md`.
