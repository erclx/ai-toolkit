---
name: git-ship
description: What the ship chain is for, the gaps it closes, and why it does not implement or review
---

# Git ship requirement

## Gap

Without this skill, the post-feature sequence runs from memory. Doc sync gets skipped, so the pull request ships with planning docs describing the previous scope, or it runs after staging has already closed and its output never reaches a commit. Chaining by hand is also where a session narrates between steps, which turns one flow into a conversation and invites a decision at every boundary.

## Must

- Invoke each step through the Skill tool in the stated order and continue without waiting
- Stage after the sync skills write, so what they produced reaches a commit
- Emit no text between steps. The sequence is the unit and prose inside it reopens settled decisions.
- Watch continuous integration to a terminal state, and stop on a failure naming the check
- Stop memory work at the Propose phase

## Must not

- Auto-trigger. Shipping is a decision the user takes, which is what the disabled model invocation encodes.
- Fix a failing check. The stop is the point, since a green pull request reached by auto-fix hides what broke.
- Run the memory Apply phase. Promoting an entry changes how the agent operates and ships as its own change.
- Implement, verify, or review. This chain starts from work already believed done.

## Guards

- A failing check stops the sequence. This is the one place text is allowed between steps.

## Out of scope

- Implementation, verification, and review, which `claude-autoship` chains ahead of this same sequence. That skill is the full pipeline and this one is the resume point after a stop, which is why the two overlap by design.
- The behavior of each step, owned by the skill invoked. This skill owns the order and nothing else.
