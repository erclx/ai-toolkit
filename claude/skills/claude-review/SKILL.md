---
name: claude-review
description: Reviews all changes since main using the project's reviewer role. Reads REVIEWER.md, CLAUDE.md, REQUIREMENTS.md, and ARCHITECTURE.md for context, then applies the reviewer role to the full diff and outputs a findings report. Use when asked to review changes, run a code review, or check the current branch. Invoke explicitly with /claude-review. Do NOT auto-trigger.
disable-model-invocation: true
---

# Claude review

## Guards

- If `.claude/REVIEWER.md` does not exist, stop: `❌ No REVIEWER.md found. Run \`aitk claude init\` to seed it.`
- If the diff is empty, stop: `✅ No changes since main. Nothing to review.`

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `.claude/REVIEWER.md`: reviewer role, severity model, and output format
- `CLAUDE.md`: project type, conventions, and commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: technical design decisions

## Step 2: get the diff

Run from the project root:

```bash
git diff main
```

## Step 3: review

Adopt the reviewer role defined in `.claude/REVIEWER.md`. Use `CLAUDE.md`, `REQUIREMENTS.md`, and `ARCHITECTURE.md` as project context to inform what is intentional vs problematic.

Apply the reviewer role to the full diff. Output structured findings only. Follow the output format defined in `.claude/REVIEWER.md`. Do not fix, rewrite, or suggest refactors outside the scope of a finding.
