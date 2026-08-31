---
title: Docs
description: How canon docs resolves the toolkit's own reference surface from an install root, and how a split domain is named
---

# Docs

`canon docs` emits the toolkit's own reference docs so an agent in a target project can orient without the toolkit source checked out. The CLI resolves `docs/` and `.claude/context/` from its install root, and which of the two it finds depends on how the CLI was installed. A registry install carries `docs/` alone, since `.claude/` is not published. A clone or a linked worktree carries both.

- `canon docs list [--json]` lists the downstream catalog: the consumer-facing `docs/` surface plus per-domain narrative from `.claude/context/` when that root is present. Toolkit-internal context entries (`ci`, `development`, `sandbox`) are dropped. From a registry install the context section is absent rather than empty.
- `canon docs <topic>` prints one doc to stdout, resolved by exact name from `docs/` first, then `.claude/context/`. Any doc the install carries is reachable by name, including the toolkit-internal topics the list omits.

A domain too large for one file splits into `<domain>/` with a generated `index.md`, and both verbs name it by the folder. `canon docs <domain>` prints that index, which is the catalog routing to the sub-area files, and the listing describes it from the index's `subtitle` where a sibling file supplies `description`. A sibling file wins over a folder of the same name. A folder carrying no `index.md` is absent from both, since a catalog is what makes the sub-areas reachable.

Data prints to stdout and the frame to stderr, so `canon docs <topic> > out.md` captures clean markdown. With no topic and no verb, `canon docs` runs `list`. An unknown topic names the available topics on stderr and exits 1.

Only a `---` block opening on the first line counts as frontmatter, so a document body carrying horizontal rules emits whole.
