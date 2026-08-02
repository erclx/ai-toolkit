---
name: claude-docs
description: What the planning-doc reconcile is for, the gaps it closes, and why the diff decides completion alone
---

# Claude docs requirement

## Gap

Without this skill, the planning docs describe the scope the session opened with. An outcome the diff shipped stays unchecked, so the board reports finished work as open and the next session re-plans it. A requirement or architecture decision that changed mid-cycle lives only in the conversation and dies with it. Plans for closed tasks accumulate in the live folder, so the folder stops indicating what is in flight.

## Must

- Take completion from the diff and everything else from the session, since completion is a fact about the repository rather than about the conversation
- Match an outcome on the behavior it names, never on a filename or a commit subject
- Leave an outcome unchecked when the diff is ambiguous. An unmarked shipped outcome costs one manual edit and a wrongly marked one hides work that never happened.
- Write tracked docs at the current worktree root and the task board at the main root, since only the first commits with the branch
- Count every other citation before archiving a plan, comparing resolved targets rather than raw strings or bare filenames
- Retarget a closed task at the archived plan, so the reasoning behind finished work stays reachable

## Must not

- Infer a new task from the diff. Only outcomes already on the board get marked.
- Touch task files the session did not change, outside the board-wide plans sweep that exists to clear a missed archive
- Widen what a writing step reads when the baseline is unusable. Widening a read is safe and widening a write stubs a surface for every file in the repository.
- Edit `CLAUDE.md` inline. Every change there goes through a diff-and-approve gate, so this skill only flags.
- Create a context entry or delete a plan

## Guards

- No `.claude/` directory: stop and name the command that sets one up
- No session divergence and no queued outcome the diff shipped: stop with a pass, since both conditions have to hold

## Out of scope

- Creating a task file or moving one off the board, which `claude-tasks` owns
- Public-facing docs, which `docs-sync` owns. This skill reconciles the `.claude/` planning surface.
- Regenerating the task index, owned by a hook
- Redrawing diagrams, which `claude-diagram` owns. This skill flags staleness and leaves the re-run to the author.
