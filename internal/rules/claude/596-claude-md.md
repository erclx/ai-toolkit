---
description: Enforce the CLAUDE.md edit protocol and keep the root file and its seed mirrored
paths:
  - 'CLAUDE.md'
  - 'tooling/claude/seeds/CLAUDE.md'
---

# CLAUDE.md standards

## Editing

- Show the proposed change as a fenced `diff` block in chat first, then wait for approval before calling the file-editing tool.
- Keep a rule that applies every session regardless of what is being edited. Move a rule that fires only when a specific path is edited into `.claude/rules/`.

## The root and seed pair

- Check the sibling in the same change. Editing the root means checking `tooling/claude/seeds/CLAUDE.md`, and editing the seed means checking the root. Nothing compares the two.
- Mirror a project-agnostic rule into both. Behavior, scope discipline, worktree gotchas, and scratch structure belong in the seed as well as the root.
- Keep a toolkit-specific rule at the root alone. The domain skill table, wiki policy, and tool-agnosticism never reach the seed.
- Leave the seed's copy of a rule this file states in place when the rule moves here. This rule reaches no target, so the seed bullet is what a target gets, and the edit protocol above is the live instance of that asymmetry.
