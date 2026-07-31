---
name: git-pr
description: Generates pull request titles and descriptions from git diffs. Use for any PR creation or update.
---

# Git PR

## Context

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/references/branch.md`: branch format, valid types, and constraints
- `${CLAUDE_SKILL_DIR}/references/pr.md`: structure, rules, and banned phrases
- `.claude/standards/prose.md` from the project root: prose conventions for all generated text
- `.claude/standards/versioning.md` from the project root: phase label vs semver discipline

Then run these commands in parallel to gather git context:

- `git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`
- `git branch --show-current 2>/dev/null || echo "unknown"`
- `git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`
- `git diff main..HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

## Guards

- If branch name does not match `<type>/<description>` format (valid types are defined in `${CLAUDE_SKILL_DIR}/references/branch.md`), stop and output:
  `❌ Branch name does not follow conventions. Run /git-branch to rename first.`
- If no commits ahead of main, stop and output:
  `❌ No commits ahead of main. Nothing to PR.`

## Response format

### Preview

- **Title:** <title>
- **Files changed:** <count>
- **Analysis:** <brief summary of impact>

After outputting the preview, execute the final command immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Testing checkboxes

Follow Testing discipline in `${CLAUDE_SKILL_DIR}/references/pr.md`. Run each check before writing its line, then tick the box and state the result the run reported. Never pre-check based on intent or past sessions.

Leave a box unchecked only for the human-only cases the reference defines, and name which human and why on the same line. A request for the reviewer is not a test result, so it belongs under `## For the reviewer` rather than in the Testing list.

### Pre-publish scan

Before running the final command, scan the PR title and body for banned characters and rewrite each occurrence:

- `—` (em dash): split into two sentences or use a comma
- `;` (semicolon): split into two sentences

These bans come from `.claude/standards/prose.md` and apply to PR text on top of `${CLAUDE_SKILL_DIR}/references/pr.md`. Reading `prose.md` is not enough. The scan is an explicit step.

### Final command

Detect an existing PR and branch: edit it in place when one is open, create it otherwise. This keeps the body in sync on a follow-up push instead of erroring on `gh pr create`.

```bash
mkdir -p .claude/.tmp/pr
cat <<'BODY' > .claude/.tmp/pr/body.md
<body content following pr.md template exactly>
BODY
git push -u origin HEAD || exit 1
if gh pr view --json number >/dev/null 2>&1; then
  gh pr edit --title "<title>" --body-file .claude/.tmp/pr/body.md
else
  gh pr create --title "<title>" --body-file .claude/.tmp/pr/body.md
fi
rm -rf .claude/.tmp/pr
```

## After execution

Respond with exactly one line:

`✅ PR: <url>`

Do not add any other text.
