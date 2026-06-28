---
name: git-pr
description: Generates pull request titles and descriptions from git diffs. Use for any PR creation or update.
---

# Git PR

## Context

Read these files from the project root in parallel:

- `.claude/standards/branch.md`: branch format, valid types, and constraints
- `.claude/standards/pr.md`: structure, rules, and banned phrases
- `.claude/standards/prose.md`: prose conventions for all generated text
- `.claude/standards/versioning.md`: phase label vs semver discipline

Then run these commands in parallel to gather git context:

- `git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`
- `git branch --show-current 2>/dev/null || echo "unknown"`
- `git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`
- `git diff main..HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

## Guards

- If branch name does not match `<type>/<description>` format (valid types are defined in `.claude/standards/branch.md`), stop and output:
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

In the generated `## Testing` section, mark items Claude executed this session as `- [x]`. Leave items that need human verification (visual UX, reviewer sanity checks) as `- [ ]`. Never pre-check based on intent or past sessions.

### Pre-publish scan

Before running the final command, scan the PR title and body for banned characters and rewrite each occurrence:

- `—` (em dash): split into two sentences or use a comma
- `;` (semicolon): split into two sentences

These bans come from `.claude/standards/prose.md` and apply to PR text on top of `.claude/standards/pr.md`. Reading `prose.md` is not enough. The scan is an explicit step.

### Final command

```bash
mkdir -p .claude/.tmp/pr && (cat <<'BODY' > .claude/.tmp/pr/body.md
<body content following pr.md template exactly>
BODY
) && git push -u origin HEAD && gh pr create --title "<title>" --body-file .claude/.tmp/pr/body.md \
  && rm -rf .claude/.tmp/pr
```

## After execution

Respond with exactly one line:

`✅ PR: <url>`

Do not add any other text.
