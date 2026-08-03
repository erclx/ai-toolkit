---
name: claude-memory-review
description: What memory review is for, the gaps it closes, and why every action waits on approval
---

# Claude memory review requirement

## Gap

Without this skill, the memory folder grows and never drains. Entries pile up restating rules a durable surface already carries, nothing decides which memory has earned a place in one, and a rule that does get promoted arrives verbatim in a file whose voice it does not match. The folder then reads as a second source of truth that no surface points at.

## Must

- Treat the folder as a holding pen, so every entry in scope leaves it as a promotion, a handoff, or a deletion rather than surviving by default
- Verify the rule is not already stated or implied in the target before proposing a promotion, by reading the target rather than trusting the memory's claim about it
- Rewrite a rule into the destination's voice instead of moving it unchanged
- Write the proposal to a receipt on disk and take no action until the user decides per item
- Keep a promotion on its own commit, since a change to how the agent operates should not ride inside a feature a reviewer is vetting for something else
- Confine the pass that runs after application to the one receipt it tested, so tidying up removes a file whose decisions are known to be resolved and leaves the pen and every untested receipt alone

## Must not

- Apply anything the user has not approved by item
- Author a governance rule inline. Coding-standards rules have an owner and a scaffolding path, and a rule written here bypasses both.
- Mutate tracked files from the main worktree
- Answer a question raised in a decision slot while applying. Discussion and application are separate passes so an approval is never inferred from a reply.
- Delete a memory entry outside the approved-per-item pass. The folder is gitignored with no history behind it, so a removal any other phase makes has no undo and no record of what it took.

## Guards

- No memory folder at the main root: stop
- The folder holds only its index: stop with a pass, not an error
- Apply invoked from the main worktree: stop and name the worktree command
- Cleanup invoked with no receipt on disk: stop with a pass, not an error

## Out of scope

- Writing memories, which `claude-memory-capture` owns
- Judging whether an entry should have been captured. That is a gate at capture time, and re-deciding it here would delete evidence the capture rule is wrong.
- Editing the governance rules a handoff points at
