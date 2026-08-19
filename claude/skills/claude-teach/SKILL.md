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

## Step 0: let the CLI resolve the workspace root

Workspaces live at the main worktree root, never inside a linked worktree. A copy per worktree forks the learning records, and the learner is one person.

Every `aitk teach` verb resolves that root in-process, so no step below composes a path to a workspace file. Read the folder through the CLI rather than deriving its location:

```bash
aitk teach list --json
```

It reports every workspace with its path, its counts, and the ordinal a new one would take. A `no-teach` refusal means the project has opened none yet, which is the new-workspace path in Step 1 rather than a reason to stop. The open verb creates the folder.

From a linked worktree the file-editing tools refuse every path under the main root and offer a worktree copy instead, which is a second file no later session reads. Never take that redirect. The route splits by what the write does to the file:

- Creating a whole file that does not exist yet, which is a lesson, a reference page, and a learning record, goes out as one plain shell command carrying a heredoc
- Changing a line inside a file that already exists goes through the verb that owns it, since the stream editors are banned and no other shell route reaches it

## Step 1: open or resume

A topic the listing already carries is a resume, and anything else is a new workspace.

On a resume, run `aitk teach list <topic> --json` for the files behind each count, then read `MISSION.md`, the highest-numbered learning record, and `GLOSSARY.md`. Those three carry where the learner stopped and what they got wrong. Report the mission's success lines with what is already met before teaching anything.

On a new workspace, settle the starting point first, by asking rather than by assuming. Difficulty with no floor under it teaches nobody, and the mission cannot be written without it.

Then open the workspace, which derives the ordinal and writes all three required files:

```bash
aitk teach open <topic> --json \
  --subject "<one line stating the subject>" \
  --starting-point "<what the learner already knows>" \
  --success "<an observable thing the learner will be able to do>" \
  --out-of-scope "<what this workspace does not cover>"
```

Repeat `--success` and `--out-of-scope` per line. The verb refuses a topic another workspace already covers, which is the guard against opening a second one on the same subject.

## Step 2: research before teaching

Read the subject from sources rather than from recall. Record what was read and what was only found through the verb that owns the file:

```bash
aitk teach resource <topic> --json \
  --read "<title, naming which claims rest on it>=<url>" \
  --lead "<title>=<url>"
```

Each flag repeats, and the pair splits on the first `=` so a URL carrying one survives. A URL already listed is refused rather than repeated.

A claim nothing was read for is the failure this step exists against. Where no source is reachable, say so in the lesson and mark what rests on recall.

## Step 3: place the learner

Pick the next lesson from the learning records rather than from the subject's own order. The target is the band immediately past what the learner can already do unaided, which `${CLAUDE_SKILL_DIR}/references/pedagogy.md` states in full.

Open with retrieval on what the last session got wrong, before anything new. A learner who cannot retrieve the previous lesson is not ready for the next one, and moving on anyway buys fluency that decays.

## Step 4: write the lesson and the reference

Two outputs with two lifetimes, and the split decides the format.

- A lesson goes to `lessons/<nnnn>-<slug>.html`, self-contained, carrying its own quiz and the feedback for each answer. It links the shared stylesheet under `assets/` rather than restating styles, and the first lesson in a workspace writes that stylesheet before linking it. A lesson is disposable and is never promoted.
- A reference page goes to `reference/<slug>.md`, written for a reader with no learner in it. This is the half that survives the workspace, so it is written in markdown to pass the authoring gates a promotion would put it through.

Add every term the lesson defines to `GLOSSARY.md` through the verb, which places the entries alphabetically in the shape the standard fixes:

```bash
aitk teach glossary <topic> --json \
  --term "<term>=<definition, written without using the term>" \
  --first-seen <the lesson or reference page this batch comes from>
```

`--term` repeats and one call writes the file once, which is what keeps a batch of terms from racing on it. A term already defined is refused, since a definition the subject has moved under is a revision of the entry rather than a second one.

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
