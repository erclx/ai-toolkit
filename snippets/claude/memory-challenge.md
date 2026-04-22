Challenge every promote item in the latest memory review before applying. Memory promotion has a high bar.

1. Resolve the main worktree root via `git worktree list --porcelain | awk '/^worktree /{print $2; exit}'` (fall back to `pwd`).
2. Read the latest `.claude/review/memory-review-*.md` at that root.
3. For each promote item, apply three tests:
   - Absorbed check. Grep the target surface for the rule's keywords. If the rule is already stated or implied, flip to delete.
   - Delta check. If the rule is a nice-to-have next to existing bullets, flip to delete.
   - Generality check. If the rule fires only on one literal trigger phrase, rewrite broader or flip to delete.
4. Rewrite the review file in place with the updated actions and a one-line reason under each flip.

No mutations to memory files or promotion targets. Challenge phase only.
