# Audit agent documentation surfaces

Reconcile overlap and drift across the three surfaces agents read in this repo. Each rule or piece of knowledge should live in exactly one surface. Other surfaces point rather than duplicate.

## The three surfaces

1. `CLAUDE.md`: project behaviors, design principles, domain-to-skill routing table. Auto-loaded every session. Short and dense.
2. `.claude/skills/aitk-<domain>/SKILL.md`: domain-gated behavior. What to do when editing a specific domain. Loaded on demand via skill triggers.
3. `docs/*.md`: narrative reference. What the domain is and how it fits together. Read on need. `docs/agents.md` is the cross-domain CLI catalog.

## Ownership rules

A rule or knowledge item goes to exactly one owner:

- Cross-domain behavior or design principle: `CLAUDE.md`.
- Behavior triggered only when editing domain X: `.claude/skills/aitk-<X>`.
- Narrative or conceptual knowledge about domain X: `docs/<X>.md`.
- CLI command surface or invocation contract: `docs/agents.md`.

When the same content exists in two places, the non-canonical copy becomes a pointer to the canonical owner.

## Execution steps

1. Enumerate each agent surface and capture its current contents. Build a small matrix: rule or topic by surface.
2. For each surface pair, find overlap by grepping keywords from one surface against the other. Flag duplicates.
3. Decide the canonical owner for each flagged duplicate using the ownership rules above.
4. Collapse each duplicate: keep the canonical entry, replace the other with a one-line pointer.
5. Check `CLAUDE.md` for rules that are actually domain-scoped. Move them into the matching skill and leave a pointer only if cross-domain visibility is needed.
6. Check each `docs/<domain>.md` for rules phrased as behavior ("do this when..."). Those belong in the skill, not the narrative.
7. Check each `.claude/skills/aitk-<domain>/SKILL.md` for narrative concepts. Those belong in the docs, not the skill.
8. Verify `docs-sync` skill still catches drift after the cleanup. If it only diffs against main, note that it will not detect cross-surface overlap and decide whether that gap needs a new check or manual audit cadence.

## Deliverables

- Each agent rule or knowledge item lives in one surface.
- A short ownership-rules block added to `CLAUDE.md` or `docs/agents.md` so future edits know where to place new content.
- Any new pointers use the colon format from `standards/prose.md`, never em dashes.

## Out of scope

- Rewriting individual docs for prose quality.
- Changing the CLI surface or command behavior.
- Consolidating skills or collapsing domains.
