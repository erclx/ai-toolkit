---
name: create-rule
description: Why a project-local rule needs a band, a number checked against two catalogs, and a scope key that decides when it fires
---

# Create rule requirement

## Gap

Without this skill, a project rule is written straight into the rules folder on a number already taken, so two rules collide and one loses. The subtler collision is with the toolkit itself. A number free in the target today can be the number a shipped rule lands on tomorrow, and the next install double-books it, so a rule the project wrote gets overwritten by one it never chose.

The band gets picked by feel, so a UI copy rule lands in the always-on range and loads on every session for the rest of the project's life. The scope key fails in both directions. An always-on rule carrying a path scope fires only on files it was never about, and a path-scoped rule missing it loads constantly. Written from memory rather than from the rule standard, the body comes out in a shape the rest of the catalog does not share.

## Must

- Resolve what the rule enforces and where it applies, asking only for what the request leaves missing
- Pick the band from the topic and take its number range and folder from that choice
- Check both the target's used prefixes and the toolkit catalog before taking a number
- Read the rule standard before writing the body
- Emit the path scope for a path-scoped rule and omit the key entirely for an always-on one
- Preview the resolved path, band, number, and frontmatter, then write without pausing
- Say when the rule loads, since path-scoped and always-on rules behave differently

## Must not

- Edit a toolkit source rule, which is authored in the toolkit and would be overwritten here
- Work the body shape or the frontmatter from memory
- Take a number without checking the toolkit catalog, which is the collision that surfaces later
- Write more than one topic into a single rule

## Guards

- No project Claude directory: stop, since there is nowhere for the rule to live
- The request names no behavior to enforce: stop rather than inventing one
- The toolkit CLI is not on PATH: scan the target alone and warn that a later install could collide

## Out of scope

- Editing a rule that already exists
- Toolkit source rules, which are authored in the toolkit rather than in a target
- Installing the rules the toolkit ships, which the governance setup path owns
- A standard, which `create-standard` owns, and a snippet, which `create-snippet` owns
