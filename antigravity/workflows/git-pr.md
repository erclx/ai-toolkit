---
description: Generates pull request titles and descriptions from git diffs
---

# Git PR

## Context

Read these files from the project root in parallel:

- `standards/pr.md`: structure, rules, and banned phrases
- `standards/prose.md`: prose conventions for all generated text

Then run these commands in parallel to gather git context:

// turbo

1. Run `git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`
   // turbo
2. Run `git branch --show-current 2>/dev/null || echo "unknown"`
   // turbo
3. Run `git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`
   // turbo
4. Run `git diff main..HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

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

Show PREVIEW first, then propose FINAL COMMAND block. Do not run until user confirms.

### Testing checkboxes

In the generated `## Testing` section, mark items Claude executed this session as `- [x]`. Leave items that need human verification (visual UX, reviewer sanity checks) as `- [ ]`. Never pre-check based on intent or past sessions.

### Pre-publish scan

Before running the final command, scan the PR title and body for banned characters and rewrite each occurrence:

- `—` (em dash): split into two sentences or use a comma
- `;` (semicolon): split into two sentences

These bans come from `standards/prose.md` and apply to PR text on top of `standards/pr.md`. Reading `prose.md` is not enough. The scan is an explicit step.

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
