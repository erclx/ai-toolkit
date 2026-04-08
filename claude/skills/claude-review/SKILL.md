---
name: claude-review
description: Reviews all changes since main for bugs, edge cases, and logic flaws. Reads CLAUDE.md, REQUIREMENTS.md, ARCHITECTURE.md, and GOV.md for context, then applies a structured review to the full diff and outputs a findings report. Use when asked to review changes, run a code review, or check the current branch. Invoke explicitly with /claude-review. Do NOT auto-trigger.
disable-model-invocation: true
---

# Claude review

## Guards

- If both `git diff --staged` and `git diff main` are empty, stop: `✅ No changes to review.`

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project type, conventions, and commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: technical design decisions
- `.claude/GOV.md`: governance rules to check changes against

## Step 2: get the diff and changed files

Run these in parallel from the project root:

```bash
git diff --staged
```

```bash
git diff --staged --name-only
```

```bash
git diff main
```

```bash
git diff main --name-only
```

If `git diff --staged` is non-empty, use it as the diff scope and use the `--staged --name-only` list as the file list. Otherwise use `git diff main` and the `main --name-only` list.

## Step 3: read changed files

Read each file from the changed file list. Skip deleted files. Run reads in parallel.

## Step 4: review

Review the full diff and changed file contents for:

1. Bugs and edge cases
2. Error handling gaps
3. Logic flaws that will cause problems when the code is extended
4. Security issues relevant to the project context
5. Violations of rules defined in `GOV.md`

Use `CLAUDE.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, and `GOV.md` as project context to inform what is intentional vs problematic. Do not fix, rewrite, or suggest refactors outside the scope of a finding.

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
