---
name: claude-groundwork
description: Opens and runs a numbered groundwork folder under `.claude/.tmp/groundwork/<slug>/` for a topic that has to be measured before it can be planned. Detects open, resume, and close from the folder itself. Use when asked to "research X", "dig into X", "work out what we should do about X", "measure this before we commit", or "open a groundwork folder". Do NOT use to write a feature plan or to implement. That is `claude-feature`.
---

# Claude groundwork

Groundwork gathers and weighs. A plan commits. A groundwork folder costs nothing to throw away, which is what makes it the right container for a question nobody has answered yet.

Read `${CLAUDE_SKILL_DIR}/references/folder-format.md` before writing any file in the folder. It holds the reserved numbers, what each required file carries, the conventions, and the anti-patterns.

## Guards

- If no topic is given, stop: `❌ No topic. Name what needs measuring.`
- Apply the qualifying test before creating anything. Two of these three must hold: the current state is not known, more than one approach is live, and committing wrong costs more than a day of measuring. When one or fewer holds, stop: `❌ Already decided enough to plan. Run /claude-feature instead.`
- Do not pause for approval between steps. The write scope below is what makes that safe.

## Write scope

- Write only inside `.claude/.tmp/groundwork/<slug>/`. A feature plan, source changes, a standard, a rule, and a reference doc all live outside that folder, so this one rule forbids every one of them.
- One exception, at close only: leave one line in the project's task file.
- Reading is not restricted. External research is in scope, so read documentation, comparable projects, and papers whenever a live question needs them.
- Treat the folder as gitignored and unbacked. It dies with the machine, so `07-next-session.md` repeats what it needs instead of pointing at its siblings.

## Step 1: detect the mode

List `.claude/.tmp/groundwork/` from the project root and match the topic against the tracks already there before deriving anything. A resume pass rarely phrases the topic the way the folder was named, so a fresh slug derived from the wording would miss a live track and restart it.

Never match against `.claude/.tmp/` itself. That directory is scratch shared with every other skill, so a topic matched there lands on a folder that was never a track.

With no match, derive a kebab-case slug named for the subject rather than the activity. Prefer `ts-migration` over `migration-research`. Then route on `.claude/.tmp/groundwork/<slug>/`:

- Folder absent: open
- Folder present without `06-decision.md`: resume
- Present folder the user judges ready: close

Detect the mode from the folder. Do not ask which one to run.

## Step 2: orient

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: behavior rules, conventions, commands
- `.claude/REQUIREMENTS.md`: scope and non-goals
- `.claude/ARCHITECTURE.md`: decisions already made
- `.claude/TASKS.md`: what is already tracked, and what a prior track concluded

Then read only what a live question needs. Do not read entire directories speculatively. Where a folder carries an `index.md`, read it first and load only the files it points at.

Do not dispatch subagents. A groundwork track is a conversation, and fanning out loses the reasoning that makes the folder worth keeping. A search too large to run inline is a finding that the question is too broad.

## Open question format

Every open question carries a lean, wherever it appears: inside a topic file, in `00-scope.md`, and in the chat output. A bare numbered list hands the reader a quiz and defers the judgment the track exists to inform.

```markdown
1. <question>
   - Leaning: <where the evidence currently points>
   - Overturned by: <the finding that would change it>
```

- `Leaning:` is weaker than a plan's `- Suggested:`. It records the current read on a question still open by definition, not a decision to accept by default at execution time.
- Pair every lean with what would overturn it. A lean with no falsifier is an opinion.
- On a measurement rather than a judgment, write `- Leaning: none, needs measuring` and drop the overturn line. A guess at a number is worse than an admission.

## Open mode

1. Create `.claude/.tmp/groundwork/<slug>/`.
2. Write `README.md` first. Writing it first forces the question of what the track is for.
3. Write `01-current-state.md` by measuring now. Never carry a figure from a previous session or from recall without re-measuring it. Measure only what an open question in the folder needs. A number with no question attached is how groundwork turns into the work.
4. Write `00-scope.md` when the track is large enough to run away. Skip it on a small track.
5. Add topic files at `02` through `05` as the subject demands. Close each one with its open questions in the format above.
6. Keep going. Revise, reframe, and take correction as the questions move. The folder is meant to be rewritten.

## Resume mode

1. Read `README.md` and its file map first, then the numbered files in order.
2. Do not re-measure what `01-current-state.md` holds unless the project moved under it. When it did move, re-measure and mark what changed.
3. Continue from the open questions carried at the end of each file. Add or rewrite files as those questions move.
4. Update the file map in `README.md` whenever a file is added or retired.

## Close mode

1. Write `06-decision.md`. It states the problem once, names the goal, lists what to do, and lists what was considered and dropped.
2. Write `07-next-session.md` self-contained, so it survives a compaction that loses the conversation.
3. Update the file map in `README.md`.
4. Leave one line in the project's task file recording what the track concluded, even when the conclusion is to do nothing. This is the only write permitted outside the folder.

Do not close while an open question quietly fails an outcome. Resolve it, or record it in `06-decision.md` as knowingly accepted.

## Output

Emit the full relative path from the project root for every file written or updated. Bare filenames are not clickable.

Open and resume:

```plaintext
📂 Opened .claude/.tmp/groundwork/<slug>/

**Written:**

- `.claude/.tmp/groundwork/<slug>/README.md`
- `.claude/.tmp/groundwork/<slug>/01-current-state.md`

**Open questions:**

1. <question>
   - Leaning: <where the evidence currently points>
   - Overturned by: <the finding that would change it>
```

Use `📂 Resumed` in place of `📂 Opened` on a resume pass.

Close:

```plaintext
✅ Closed .claude/.tmp/groundwork/<slug>/

**Written:**

- `.claude/.tmp/groundwork/<slug>/06-decision.md`
- `.claude/.tmp/groundwork/<slug>/07-next-session.md`

<the decision in one line>

Next: /claude-feature
```
