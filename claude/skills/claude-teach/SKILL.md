---
name: claude-teach
description: Opens and runs a learning workspace on one subject, holding a mission, resources, numbered lessons, reference pages, a glossary, and learning records that survive across sessions, and proposes where a durable page from one belongs once it outgrows the workspace. Use when asked to "teach me X", "open a learning workspace", "I want to learn X", "quiz me on this", "continue the lesson", "resume my workspace on X", or "promote this reference page". Do NOT use to write project documentation, which belongs to the surface owning that document, and do NOT use to answer one question, which is an ordinary reply.
disable-model-invocation: true
argument-hint: <subject to learn, or the topic of a workspace to resume or promote>
---

# Claude teach

Run a learning workspace on one subject across sessions. The workspace holds what the learner has been through, so a session weeks later resumes from the folder rather than from the conversation.

The shape of the workspace is fixed by `.claude/standards/teach.md`, or `${CLAUDE_SKILL_DIR}/../../standards/teach.md` when the project does not have that file. Read it before writing anything into the folder. The glossary answers to `.claude/standards/glossary.md`, or `${CLAUDE_SKILL_DIR}/../../standards/glossary.md` when the project does not have it. The pedagogy sits in `${CLAUDE_SKILL_DIR}/references/pedagogy.md`, the lesson craft in `${CLAUDE_SKILL_DIR}/references/lesson-craft.md`, and the promotion routing in `${CLAUDE_SKILL_DIR}/references/promotion.md`.

## Guards

- If the invocation names no subject and no existing workspace matches, stop: `❌ No subject. Invoke with the subject to learn, or the topic of a workspace to resume.`
- Never trust recall for what the subject says. Research first, cite what was read, and say what was not.
- Write nothing outside the workspace folder, apart from the one handoff file Step 6 names. A durable page stays in `reference/` and is copied out by the skill that owns the destination, never by this one.
- Do not open a second workspace on a subject one already covers. Resume that one.
- Never promote a lesson. It is generated markup carrying a quiz and a learner, and no request makes it promotable.

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

A topic the listing already carries is a resume, and anything else is a new workspace. An invocation asking to promote is neither: read the named workspace through the listing and go to Step 6, which teaches nothing and writes no lesson.

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

## Step 6: propose where the durable half belongs

Run this when the invocation asks for it, or offer it in one line when a mission finishes, since that is when the workspace stops growing and its reference pages stop changing. Never run it unasked mid-course.

Read `${CLAUDE_SKILL_DIR}/references/promotion.md` first. It carries what may be promoted, the routing test, both spellings of the wiki folder, the refusal when a project has none, and what each destination expects a page to carry.

Propose and wait. A promoted page is public prose that needs a line naming who owns its subject, which is a judgment about ownership rather than a move a session makes on its own reading. Present one block per candidate page:

```plaintext
reference/<slug>.md → <destination path>
Subject owner: <who owns it, in a few words>
Still owed:    <what the destination expects that the page does not carry yet>
```

Then stop and let the operator strike, redirect, or confirm each block.

Write nothing to a destination here. One skill owns the durable writes, and two skills editing one file at one step is the failure that rule exists against. Record each confirmed block in `.claude/.tmp/teach-promotion/<slug>.md` at the main worktree root instead, appending when the file exists, with one H2 per destination naming its path, the source page beneath it, and the page body fenced:

````markdown
## <destination path>

Source: .claude/teach/<nn>-<topic>/reference/<slug>.md

```markdown
<the page body as it should land, with the source line the destination expects>
```
````

The body is fenced rather than written bare because a reference page carries headings of its own, and the reader splits this file on its H2 lines. An unfenced body turns every section heading in the page into a destination naming no path. Open the body fence with four backticks so a page carrying a fenced code block of its own still closes where it should, and widen both fences together if it carries a four-backtick fence.

Derive `<slug>` per `.claude/standards/slug.md`, or `${CLAUDE_SKILL_DIR}/../../standards/slug.md` when the project does not have it. Fall back to `latest` on an empty result.

The handoff is its own file rather than a shared one. The routed-facts file another skill writes is deleted by whichever pass folds it, so a second producer's unread work goes with it, and a sibling path costs the folding skill one more read and removes the interaction.

An append is a whole-file operation, so send it as a plain single `Bash` command carrying a heredoc, per Step 0. Then tell the operator that `/claude-docs` folds the file in from a branch. The proposal costs nothing tracked and runs anywhere, while the page it describes is a tracked file, so the fold is a worktree operation and the workspace it came from is not.

## Output

```plaintext
✅ <opened|resumed> .claude/teach/<nn>-<topic>/
Lesson:    .claude/teach/<nn>-<topic>/lessons/<nnnn>-<slug>.html
Reference: .claude/teach/<nn>-<topic>/reference/<slug>.md
Record:    .claude/teach/<nn>-<topic>/learning-records/<nnnn>-<slug>.md
Progress:  <n> of <m> success lines met
```

Omit the reference line where the lesson produced no durable page. Emit every path from the project root, in the form the project's instruction file sets.

A promotion pass reports its own shape instead, one line per page the operator confirmed and one naming the handoff:

```plaintext
➡️ Promoting: .claude/teach/<nn>-<topic>/reference/<slug>.md → <destination path>
→ Confirmed pages wait at .claude/.tmp/teach-promotion/<slug>.md. Run /claude-docs from a branch to fold them in.
```

A pass where the operator confirmed nothing writes no handoff file and reports that alone.
