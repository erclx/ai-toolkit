---
name: claude-teach
description: Scope boundary for learning a subject across sessions, and the split between the disposable lesson and the durable reference page
---

# Claude teach requirement

## Gap

Without this skill, a session asked to teach a subject answers in the conversation, so everything it produced dies with the session and the next one starts from nothing. It teaches from recall rather than from a source, so the learner is handed claims nothing was read for and cannot tell which ones. It picks the next topic from the subject's own order rather than from what the learner got wrong, so it teaches past a gap it never measured. It asks nothing about what the learner already knows, so difficulty has no floor and the session lands either below or far above them.

It also produces one output where two are needed. A page written to be worked through once and a page written to be looked up later have different lifetimes and different readers, and merging them yields material that is disposable and gets kept, or durable and carries a quiz nobody can promote. Writing the durable half in a format the authoring gates do not read costs a conversion at the moment it matters most, which is the moment someone tries to promote it.

A session that does record something records the wrong thing. It writes what was taught rather than what the learner retrieved, and a tally of errors carries none of the misconception a later session would work against.

Two failures land specifically on where the folder sits. A workspace resolved against the current directory forks into a copy per linked worktree, so the learning records split and no session sees the whole history. A body naming only the destination path reports success and loses the write, because the file-editing tools refuse a main-root path from a linked worktree and offer a worktree copy instead.

## Must

- Hold the workspace at the main worktree root, so one learner has one history rather than one per worktree
- Name the write route for a main-root path from a linked worktree, since a body naming only the destination reports a success that did not happen
- Route every edit inside a workspace file that already exists through a verb resolving the root in-process, since a heredoc reaches a whole-file create alone and the stream editors that would reach the rest are banned
- Settle the learner's starting point by asking, so difficulty sits above a measured floor
- Research the subject from sources before teaching it, and record what was read and what was found and not opened
- Place each lesson from the learning records rather than from the subject's order, and open with retrieval on the last wrong answer
- Split the output by lifetime, sending the worked-through half to lessons and the looked-up half to reference pages in the format the authoring gates read
- Record the wrong answer itself rather than the count, since that is what the next session places the learner from
- Report progress against the mission's success lines, so a mission can be called finished

## Must not

- Teach from recall without saying which claims rest on it
- Write outside the workspace folder, which is what a promotion pass owns rather than this skill
- Open a second workspace on a subject an existing one already covers
- Renumber a workspace folder, a lesson, or a learning record, since the number is cited by files already written

## Guards

- No subject named and no existing workspace matching, stop rather than opening a workspace with nothing to learn

## Out of scope

- Promoting a durable page out of the workspace, which is a judgment about public prose and belongs to a separate surface
- What the verbs do internally, which is the CLI domain's own contract rather than this skill's, and the records backup that carries the folder off one disk
- What a lesson renders as and how a quiz behaves once rendered, which the lesson-craft reference shapes and a rendering layer executes
- Deciding when to fire. The skill is user-invoked through `disable-model-invocation`, so opening a workspace is the learner's call rather than a description match.
