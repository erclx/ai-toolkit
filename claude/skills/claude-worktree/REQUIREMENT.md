---
name: claude-worktree
description: Why worktree entry is wrapped rather than called directly, covering name derivation, the branch rename downstream slugs depend on, and the shared-config repair
---

# Claude worktree requirement

## Gap

Without this skill, the user names the worktree by hand, and a name matching no plan breaks every slug derived from it afterward. The entry tool then creates the branch as `worktree-<name>`, which diverges from the name the folder carries, so the ship chain looks for a plan file under a slug that does not exist and stops with nothing wrong except the name.

Entry also writes the bare flag into the shared config, which strands the main worktree. Every command run there fails while the files sit untouched on disk, and the linked worktree keeps working, so nothing surfaces until the operator returns to the main checkout and finds the repository broken. A rename onto a branch that already exists is the third failure, and it is the one that destroys work rather than blocking it.

## Must

- Derive the name from the plan matched to the current branch, falling through the ordered sources rather than picking
- Validate and sanitize the derived name against what the entry tool accepts
- Preview the resolved name and which source produced it before entering
- Rename the created branch to match the worktree name, so downstream slug derivation resolves
- Read the bare flag before writing it, and repair it on both sides of entry
- Announce the repair only when a write actually happened

## Must not

- Pick between plans when more than one could match. Ask.
- Enter on a name inferred from session context without confirmation
- Delete or overwrite a branch that already carries the target name
- Rename when the worktree was entered by path, since that branch already has its own identity
- Invoke the exit path, which is the user's call

## Guards

- Already inside a linked worktree: stop rather than nesting
- Not a git repository and no creation hook configured: stop
- Target branch already exists: stop and leave it alone, since resolving it automatically risks the wrong branch

## Out of scope

- Listing, cleaning up, or rotating worktrees, which `git-worktree` owns
- Leaving a worktree, which the user decides
- What runs inside the worktree once entered, which the caller drives
