---
description: Reviews all changes since main using the project's reviewer role. Reads REVIEWER.md, CLAUDE.md, REQUIREMENTS.md, and ARCHITECTURE.md for context, then outputs a findings report. Use when asked to review changes, run a code review, or check the current branch.
---

# Claude review

## Guards

- If `.claude/REVIEWER.md` does not exist, stop: `❌ No REVIEWER.md found.`
- If both `git diff --staged` and `git diff main` are empty, stop: `✅ No changes to review.`

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `.claude/REVIEWER.md`: reviewer role, severity model, and output format
- `CLAUDE.md`: project type, conventions, and commands
- `GEMINI.md`: project type, conventions, and commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: technical design decisions

## Step 2: get the diff and changed files

Run these in parallel:

// turbo

1. Run `git diff --staged`
   // turbo
2. Run `git diff --staged --name-only`
   // turbo
3. Run `git diff main`
   // turbo
4. Run `git diff main --name-only`

If `git diff --staged` is non-empty, use it as the diff scope. Otherwise use `git diff main`.

## Step 3: read changed files

Read each file from the changed file list. Skip deleted files. Run reads in parallel.

## Step 4: review

Adopt the reviewer role defined in `.claude/REVIEWER.md`. Use `CLAUDE.md`, `REQUIREMENTS.md`, and `ARCHITECTURE.md` as project context.

Apply the reviewer role to the full diff and the changed file contents. Output structured findings only. Follow the output format defined in `.claude/REVIEWER.md`. Do not fix, rewrite, or suggest refactors outside the scope of a finding.
