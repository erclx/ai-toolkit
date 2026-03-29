---
name: git-pr
description: Generates pull request titles and descriptions from git diffs. Use for any PR creation or update.
---

# Git PR

## Context

Read these files from the project root in parallel:

- `standards/pr.md`: structure, rules, and banned phrases
- `standards/prose.md`: prose conventions for all generated text

Then run these commands in parallel to gather git context:

- `git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`
- `git branch --show-current 2>/dev/null || echo "unknown"`
- `git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`
- `git diff main..HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

## Guards

- If branch name does not match `<type>/<description>` format (valid types: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `test`, `style`, `build`, `ci`, `revert`), stop and output:
  `❌ Branch name does not follow conventions. Run /git-branch to rename first.`
- If no commits ahead of main, stop and output:
  `❌ No commits ahead of main. Nothing to PR.`

## Response format

### Preview

- **Title:** <title>
- **Files changed:** <count>
- **Analysis:** <brief summary of impact>

After outputting the preview, execute the final command immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Final command

```bash
mkdir -p .claude/.tmp && (cat <<'BODY' > .claude/.tmp/pr-body.md
<body content following pr.md template exactly>
BODY
) && git push -u origin HEAD && gh pr create --title "<title>" --body-file .claude/.tmp/pr-body.md \
  && rm .claude/.tmp/pr-body.md
```

## After execution

Respond with exactly one line:

`✅ PR: <url>`

Do not add any other text.
