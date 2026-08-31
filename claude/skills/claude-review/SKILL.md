---
name: claude-review
description: Reviews all changes since main for bugs, edge cases, and logic flaws. Reads CLAUDE.md, REQUIREMENTS.md, and ARCHITECTURE.md for context, then applies a structured review to the full diff and outputs a findings report. Coding standards from `.claude/rules/` are auto-loaded by Claude Code. Use when asked to review changes, run a code review, or check the current branch. Do NOT auto-trigger on vague signals like "looks good" or "can you check this". Require an explicit review request or an autoship invocation.
---

# Claude review

## Guards

- Resolve the base ref first, per Diff baseline below. If the staged set, the branch set, and the working set are all empty, stop: `✅ No changes to review.` A guard reading bare local `main` stops the skill on `main` before it ever reaches Step 2.

## Diff baseline

Resolve the base ref once and reuse it in the guard and in Step 2:

```bash
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null
```

Prefer `origin/main` over local `main`. On `main` itself the local ref resolves to HEAD, so every committed change drops out of the set and the skill reports a clean branch rather than admitting it cannot see the work.

The baseline is unusable in two cases:

- No merge base resolves against either ref.
- The base equals HEAD, whichever ref resolved it. Nothing is committed ahead of the base to compare against. This is the ordinary shape on `main`, and on a feature branch before its first commit.

An unusable baseline costs only the committed half. `git diff <base> HEAD` is empty by definition once the base equals HEAD, while the staged set and `git diff HEAD` still report work at correct scope. Review those and lead the report with `⚠ Baseline unusable. Reviewed the uncommitted set only.`, so a clean summary is never read as a clean branch.

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project type, conventions, and commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: technical design decisions

Coding standards from `.claude/rules/` are auto-loaded by Claude Code. Always-on rules apply every session. Path-scoped rules apply to files matching their `paths:` glob.

## Step 2: get the diff and changed files

Resolve the base ref per Diff baseline above, then run these in parallel from the project root:

```bash
git diff --staged
```

```bash
git diff --staged --name-only
```

```bash
git diff <base> HEAD
```

```bash
git diff <base> HEAD --name-only
```

If `git diff --staged` is non-empty, use it as the diff scope and use the `--staged --name-only` list as the file list. Otherwise use `git diff <base> HEAD` and its name-only list.

When the baseline is unusable, substitute `git diff HEAD` and `git diff HEAD --name-only` for the branch pair. Never substitute the whole tree for a missing baseline.

## Step 3: read changed files

Read each file from the changed file list. Skip deleted files. Run reads in parallel.

## Step 4: review and persist

Review the full diff and changed file contents for:

1. Bugs and edge cases
2. Error handling gaps
3. Logic flaws that will cause problems when the code is extended
4. Security issues relevant to the project context
5. Violations of rules from `.claude/rules/` that apply to the changed files

Use `CLAUDE.md`, `.claude/REQUIREMENTS.md`, `.claude/ARCHITECTURE.md`, and the auto-loaded `.claude/rules/` as project context to inform what is intentional vs problematic. Do not fix, rewrite, or suggest refactors outside the scope of a finding.

### High-signal filter

Flag only issues that will definitely cause incorrect behavior or break a documented rule. Skip:

- Code style or quality concerns
- Subjective suggestions
- Linter territory
- Issues that depend on unverified state

A comment that makes a false claim about the code is a correctness finding, not a style one. Flag it past the exclusions above and let the severity ladder rank it.

If uncertain, do not flag. False positives erode trust.

### Severity

- **critical**: blocks the feature. Broken in production if shipped.
- **should-fix**: fix in same session while context is fresh. Not a blocker.
- **minor**: not worth fixing now. Include for visibility.

### Report format

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

If nothing is wrong, use: `✅ No findings.`

### Persist

Derive `<slug>` per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. Fall back to `latest` on an empty result.

Write the full report directly to `.claude/review/branch/review-<slug>.md` at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`. Create the directory if it does not exist. Always overwrite.

From a linked worktree the file-editing tools refuse that path, so the report goes out through `Bash`. Send the `mkdir -p` and the heredoc as two plain commands rather than joining them with `&&`, which is refused as compound.

If there are no findings, write `✅ No findings.` to the file with a timestamp.

The `.claude/review/` directory is gitignored. Do not stage or commit the file.

The report is disposable. It outlives the ship chain that reads it, and `claude-docs` sweeps it once the branch it names is gone, because the durable record of what a review found is the comment `claude-pr-review` posts on the pull request. A review run on a branch that never opens one leaves nothing behind once that branch is gone, so fold anything worth keeping into the pull request body or a task finding while the report is still on disk.

### Chat output

Output only the summary line and the file path. Do not repeat the full report in chat.

```plaintext
X critical, Y should-fix, Z minor across N files.
📝 Wrote .claude/review/branch/review-<slug>.md
```

If no findings: `✅ No findings. Wrote .claude/review/branch/review-<slug>.md`
