---
name: claude-teach
description: Opens and runs a learning workspace on one subject, holding a mission, resources, numbered lessons, reference pages, a glossary, and learning records that survive across sessions. Use when asked to "teach me X", "open a learning workspace", "I want to learn X", "quiz me on this", "continue the lesson", or "resume my workspace on X". Do NOT use to write project documentation, which belongs to the surface owning that document, and do NOT use to answer one question, which is an ordinary reply.
disable-model-invocation: true
argument-hint: <subject to learn, or the topic of the workspace to resume>
---

# Claude teach

Run a learning workspace on one subject across sessions. The workspace holds what the learner has been through, so a session weeks later resumes from the folder rather than from the conversation.

The shape of the workspace is fixed by `.claude/standards/teach.md`, or `${CLAUDE_SKILL_DIR}/../../standards/teach.md` when the project does not have that file. Read it before writing anything into the folder. The pedagogy sits in `${CLAUDE_SKILL_DIR}/references/pedagogy.md` and the lesson craft in `${CLAUDE_SKILL_DIR}/references/lesson-craft.md`.

## Guards

- If the invocation names no subject and no existing workspace matches, stop: `❌ No subject. Invoke with the subject to learn, or the topic of a workspace to resume.`
- Never trust recall for what the subject says. Research first, cite what was read, and say what was not.
- Write nothing outside the workspace folder. A durable page stays in `reference/` until a promotion pass moves it, and this skill runs no promotion.
- Do not open a second workspace on a subject one already covers. Resume that one.

## Step 0: resolve the workspace root

Workspaces live at the main worktree root, never inside a linked worktree. A copy per worktree forks the learning records, and the learner is one person.

```bash
git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-
```

Fall back to the current directory when that reports nothing. Workspaces sit under `<main-root>/.claude/teach/`.

From a linked worktree the file-editing tools refuse every path under that root and offer a worktree copy instead, which is a second file no later session reads. Never take that redirect. Create a file as one plain shell command carrying a heredoc, and change a file that already exists by reading it and writing it back whole through the same route.

## Step 1: open or resume

List the folders under the workspace root. A folder whose topic matches the invocation is a resume, and anything else is a new workspace.

On a resume, read `MISSION.md`, the highest-numbered learning record, and `GLOSSARY.md`. Those three carry where the learner stopped and what they got wrong. Report the mission's success lines with what is already met before teaching anything.

On a new workspace, settle the starting point first, by asking rather than by assuming. Difficulty with no floor under it teaches nobody, and the mission cannot be written without it.

Then take the ordinal from the highest one present, incremented, create the folder as `<nn>-<topic>`, and write all three files the standard requires: `MISSION.md` to the template it carries, `RESOURCES.md` with whatever Step 2 read, and `GLOSSARY.md`, empty of terms until a lesson defines one. A workspace missing any of the three fails its own conformance check the moment anything walks it.

## Step 2: research before teaching

Read the subject from sources rather than from recall. Record every source in `RESOURCES.md` with its link, and list under a leads heading anything found and not opened.

A claim nothing was read for is the failure this step exists against. Where no source is reachable, say so in the lesson and mark what rests on recall.

## Step 3: place the learner

Pick the next lesson from the learning records rather than from the subject's own order. The target is the band immediately past what the learner can already do unaided, which `${CLAUDE_SKILL_DIR}/references/pedagogy.md` states in full.

Open with retrieval on what the last session got wrong, before anything new. A learner who cannot retrieve the previous lesson is not ready for the next one, and moving on anyway buys fluency that decays.

## Step 4: write the lesson and the reference

Two outputs with two lifetimes, and the split decides the format.

- A lesson goes to `lessons/<nnnn>-<slug>.html`, self-contained, carrying its own quiz and the feedback for each answer. It links the shared stylesheet under `assets/` rather than restating styles, and the first lesson in a workspace writes that stylesheet before linking it. A lesson is disposable and is never promoted.
- A reference page goes to `reference/<slug>.md`, written for a reader with no learner in it. This is the half that survives the workspace, so it is written in markdown to pass the authoring gates a promotion would put it through.

Add every term the lesson defines to `GLOSSARY.md`, in the entry shape the standard fixes.

Follow `${CLAUDE_SKILL_DIR}/references/lesson-craft.md` for what makes a lesson worth returning to. Keep every quiz answer the same length, so formatting leaks no clue about which one is correct.

## Step 5: record what happened

Write `learning-records/<nnnn>-<slug>.md` before the session ends, carrying the lessons covered, what the learner retrieved unaided, what they got wrong with the wrong answer itself, and what to revisit.

Record the wrong answer rather than the count. The next session places the learner from this file, and a tally carries no misconception to work against.

Then restate the mission's success lines with what is now met. A mission whose lines are all met is finished, and saying so is what closes a workspace.

## Output

```plaintext
✅ <opened|resumed> .claude/teach/<nn>-<topic>/
Lesson:    .claude/teach/<nn>-<topic>/lessons/<nnnn>-<slug>.html
Reference: .claude/teach/<nn>-<topic>/reference/<slug>.md
Record:    .claude/teach/<nn>-<topic>/learning-records/<nnnn>-<slug>.md
Progress:  <n> of <m> success lines met
```

Omit the reference line where the lesson produced no durable page. Emit every path from the project root, in the form the project's instruction file sets.
