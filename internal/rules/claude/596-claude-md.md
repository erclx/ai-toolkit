---
description: Keep the toolkit root CLAUDE.md and its seed mirrored
paths:
  - 'CLAUDE.md'
  - 'tooling/claude/seeds/CLAUDE.md'
---

# CLAUDE.md seed standards

## The root and seed pair

- Check the sibling in the same change. Editing the root means checking `tooling/claude/seeds/CLAUDE.md`, and editing the seed means checking the root. Nothing compares the two.
- Mirror a project-agnostic rule into both. Behavior, scope discipline, worktree gotchas, and scratch structure belong in the seed as well as the root.
- Keep a toolkit-specific rule at the root alone. The domain skill table, wiki policy, and tool-agnosticism never reach the seed.
- Leave the seed's copy of a rule this file states in place when the rule moves here. This rule reaches no target, so the seed bullet is what a target gets.
- Name the capability a seed line needs rather than the toolkit binary supplying it. A scaffolded project reads the seed as instruction about itself and may not have `aitk` installed, so a citation there hands it a verb it cannot run. `scripts/core/check-seed-independence.sh` fails the push when one reaches seed prose.
