---
name: git-issue
description: Format a bug or task from the current session into a GitHub issue and file it on the current repo via `gh issue create`. Use when asked to "file an issue", "open an issue", "log this bug", "raise an issue", or "track this as an issue". Do NOT use to report a toolkit defect from a target project (that is `toolkit-feedback`), or to open a pull request (that is `git-pr`).
---

# Git issue

Format an issue from session context following the issue standard, then file it on the current repository with `gh issue create`.

## Context

Read these in parallel:

- `${CLAUDE_SKILL_DIR}/references/issue.md`: issue title, labels, body sections, and banned phrases
- `.claude/standards/prose.md` from the project root: prose conventions for all generated text

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

Then gather repo context in parallel:

- `git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`
- `gh auth status >/dev/null 2>&1 && echo "AUTHED" || echo "NO_AUTH"`

## Guards

- If nothing in session context describes a concrete bug or task, stop: `❌ No issue in session context. Describe the bug or task, then re-invoke.`
- If `git remote get-url origin` returns `NO_REMOTE`, stop: `❌ No GitHub remote. gh issue create needs an origin.`
- If `gh auth status` returns `NO_AUTH`, stop: `❌ gh is not authenticated. Run gh auth login.`
- If the type is ambiguous between a bug and a task, ask one line before formatting.

## Response format

### Preview

- **Title:** `<type>: <subject>`
- **Label:** <bug or enhancement>
- **Analysis:** <one line on what the issue captures>

After outputting the preview, execute the final command immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Pre-publish scan

Before running the final command, scan the title and body for banned characters and rewrite each occurrence:

- `—` (em dash): split into two sentences or use a comma
- `;` (semicolon): split into two sentences

These bans come from `.claude/standards/prose.md`. Reading it is not enough. The scan is an explicit step.

### Final command

Map a bug to `--label bug` and a task to `--label enhancement`.

```bash
mkdir -p .claude/.tmp/issue
cat <<'BODY' > .claude/.tmp/issue/body.md
<body following the issue.md sections>
BODY
gh issue create --title "<type>: <subject>" --label <bug or enhancement> --body-file .claude/.tmp/issue/body.md
rm -rf .claude/.tmp/issue
```

## After execution

Respond with exactly one line:

`✅ Issue: <url>`

Do not add any other text.
