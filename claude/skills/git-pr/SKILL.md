---
name: git-pr
description: Generates pull request titles and descriptions from git diffs. Use when opening a PR, writing a PR body, or asking "create a PR" or "open a pull request".
---

# Git PR

Before generating a PR description, read:

- `standards/pr.md` — structure, rules, and banned phrases
- `standards/prose.md` — prose conventions for all generated text

Follow them exactly.

## Context

Run `scripts/context.sh` to gather git context before generating the PR description.

## Guards

- If context shows no commits ahead of main, stop and output:
  `❌ No commits ahead of main. Nothing to PR.`

## Response Format

### Preview

- **Title:** <title>
- **Files Changed:** <count>
- **Analysis:** <brief summary of impact>

### Final command

```bash
mkdir -p .claude/.tmp && (cat <<'BODY' > .claude/.tmp/pr-body.md
<body content following pr.md template exactly>
BODY
) && gh pr create --title "<title>" --body-file .claude/.tmp/pr-body.md \
  && rm .claude/.tmp/pr-body.md \
  && echo "Link: $(gh pr view --json url -q .url)"
```
