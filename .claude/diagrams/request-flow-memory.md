---
title: Memory lifecycle
description: How a captured pattern travels from the holding pen to a durable surface or to deletion, drawn from the two memory skills
category: Request flow
verified: 9da595ee 2026-08-06
---

# Memory lifecycle

Where a lesson learned mid-session goes, and what has to happen before it changes how the agent behaves.

```mermaid
sequenceDiagram
  accTitle: How a captured memory reaches a durable surface or gets deleted
  accDescr: A ship run invokes capture which writes qualifying patterns into a holding pen, review reads the pen and checks each rule against the surface that would hold it, a receipt goes to the human with one decision slot per entry, and apply either promotes a rewritten rule into a durable surface and clears the entry or deletes it outright.

  participant Ship as Ship run
  participant Cap as Capture
  participant Pen as .claude/memory
  participant Rev as Review
  actor Human
  participant Surf as CLAUDE.md or skill

  Ship->>Cap: run at ship time
  Cap->>Pen: write entries above threshold
  Ship->>Rev: propose on the captured set
  Rev->>Pen: read every entry
  Rev->>Surf: check whether the rule is already stated
  Rev-->>Human: receipt, one decision per entry
  Human->>Rev: apply, skip, or ask
  Rev->>Surf: promote the rewritten rule
  Rev->>Pen: clear the promoted entry
```

`.claude/memory/` is a holding pen rather than a destination. Capture runs at ship time and writes what the session proved durable, held to a threshold that keeps first-occurrence slips out. Review then defaults every entry to promote or delete, so an entry that survives a review untouched is the exception and needs a reason such as an open task still depending on it.

The two checks before a promote are what keep the pen from growing into a second set of rules. Review greps the destination surface first, and a rule already stated there is deleted rather than promoted, because a memory file claiming it is documented elsewhere is not evidence. A rule that resists crisp one-line phrasing is also deleted, since a vague entry costs a read on every future session and changes no behavior. Nothing is promoted unchanged, and the rewrite matches the destination's tone.

The human message is the gate, because a promote mutates how the agent operates on every later session, and a ship run stops at the proposal rather than applying on its own. Destination follows scope: cross-domain behavior goes to `CLAUDE.md`, a rule firing only inside one domain goes to that skill body, and a coding-standards rule is handed off to governance rather than authored inline. `claude/skills/claude-memory-capture/SKILL.md` and `claude/skills/claude-memory-review/SKILL.md` carry the thresholds and the five review phases. This entry is also where the catalog records its own ceiling, since it is the last one added: nine is the stopping point because maintenance binds before candidate supply does, and five more defensible kinds would each cost a render and four visual checks on every sweep.
