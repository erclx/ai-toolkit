---
title: Diagram staleness sweep
description: The contradicted-entry marker, the source-signal table that decides an uncovered kind, the stub it writes, and the report lines
---

# Diagram staleness sweep

Mechanics for Step 5 of `claude-docs`. The body owns the skip conditions, the frontmatter-only constraint, and the standard citation, and this file owns what the sweep does once the diff carries a delete or a new source signal.

## Contradicted entries

For each entry, collect the backticked code paths its explanation cites. When a cited path is in the diff as a delete or a rename and no longer exists in the tree, append a `stale` key to that entry's frontmatter naming the path:

```yaml
stale: 'src/gov/install.ts no longer exists'
```

Append that key alone. Never edit `verified`, `title`, `description`, or `category`, and never touch the body. When the entry already carries `stale`, extend the existing line rather than adding a second key.

## Uncovered kinds

The standard fixes one source signal per kind. Stub a kind when the diff adds its signal file and no entry covers that kind. The trigger is the signal appearing, never a file under it changing, so a branch editing a component folder that `components.md` already covers produces nothing here.

| Signal added by the diff                                                                                           | Kind stubbed when absent |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `.claude/REQUIREMENTS.md`                                                                                          | `system-context.md`      |
| `.claude/ARCHITECTURE.md`                                                                                          | `components.md`          |
| A deploy or infrastructure config (`Dockerfile`, `.github/workflows/*`, `vercel.json`, `fly.toml`, `compose.yaml`) | `deployment.md`          |

Leave `request-flow.md` and `data-pipeline.md` out. Neither has a source signal a diff can point at, so a rule covering them would guess at when they went stale.

Write the stub at `.claude/diagrams/<kind>.md`:

```markdown
---
title: <Kind as title case>
description: 'TODO: name the question this entry settles.'
category: <the category the standard fixes for this kind>
verified: 'TODO: never verified'
---

# <Kind as title case>

TODO: draw this. `<signal path>` entered the tree with no entry covering this kind.

Run `/claude-diagram <kind>` to replace the stub.
```

No mermaid fence. An empty stub is visible debt that reaches review through the branch diff, while a generated diagram nobody rendered is invisible debt that reads as verified. A fence here invites the next session to fill it in without a render.

## Output

Output one line per finding:

- `⚠ Diagram stale: .claude/diagrams/<kind>.md cites <path>, which left the tree`
- `📝 Stubbed: .claude/diagrams/<kind>.md`

If the sweep finds nothing, skip silently. An ordinary change that adds no signal and deletes no cited path produces no output at all.
