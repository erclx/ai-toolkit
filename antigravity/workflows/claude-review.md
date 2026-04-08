---
description: Reviews all changes since main for bugs, edge cases, and logic flaws. Reads CLAUDE.md, REQUIREMENTS.md, ARCHITECTURE.md, and GOV.md for context, then outputs a findings report. Use when asked to review changes, run a code review, or check the current branch.
---

# Claude review

## Guards

- If both `git diff --staged` and `git diff main` are empty, stop: `✅ No changes to review.`

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project type, conventions, and commands
- `GEMINI.md`: project type, conventions, and commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: technical design decisions
- `.claude/GOV.md`: governance rules to check changes against

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

Review the full diff and changed file contents for:

1. Bugs and edge cases
2. Error handling gaps
3. Logic flaws that will cause problems when the code is extended
4. Security issues relevant to the project context
5. Violations of rules defined in `GOV.md`

Use `CLAUDE.md`, `GEMINI.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, and `GOV.md` as project context to inform what is intentional vs problematic. Do not fix, rewrite, or suggest refactors outside the scope of a finding.

### Severity

- **critical**: blocks the feature. Broken in production if shipped.
- **should-fix**: fix in same session while context is fresh. Not a blocker.
- **minor**: not worth fixing now. Include for visibility.

### Output format

Start with a summary line. Group findings by file. Within each file, list findings sorted by severity (critical first, then should-fix, then minor). Omit files with no findings.

```markdown
X critical, Y should-fix, Z minor across N files.

File: path/to/file.ext

- **critical**: finding
- **should-fix**: finding
- **minor**: finding

File: path/to/other.ext

- **critical**: finding
- **minor**: finding
```

If nothing is wrong, say so: `✅ No findings.`
