---
name: canon-feedback-file
description: Format a paste-back report about something broken, missing, or off in canon and write it directly to the toolkit's `.canon/review/feedback/` folder via `canon feedback`. Use when asked to "send this to the toolkit", "report this to canon", "file toolkit feedback", or "give the toolkit feedback about X". Do NOT use for general complaints about other tooling, IDE issues, or in-project bugs that do not implicate canon surfaces.
---

# Canon feedback file

Format a `## Toolkit feedback` block from the current session, then ship it to the toolkit repo without manual copy-paste.

## Guards

- If nothing in session context points to a toolkit issue, stop: `❌ No toolkit issue in session context. Describe what broke, then re-invoke.`
- If the surface type is ambiguous (snippet vs. plugin skill vs. CLI vs. seed), ask one line before formatting.
- Do not probe the project, list files, grep, or read toolkit surfaces. Use only what the session already contains.

## Step 1: build the block

From the conversation so far, identify:

- Target project name or path
- Toolkit surface and its type (plugin skill, snippet, tooling config, governance rule, seed, or CLI)
- Specific toolkit file or name when the session cites one
- Observed behavior
- Expected behavior, or `unclear`
- Repro details already in context (commands run, files touched), or `none`
- Proposed fix when the user stated one, or `open`

Format as a single fenced markdown block:

```markdown
## Toolkit feedback

**From project:** <name or path>
**Surface:** <type>, <file path or name>
**Observed:** <one or two lines>
**Expected:** <one or two lines, or "unclear">
**Repro:** <commands or steps, or "none">
**Proposed fix:** <one line, or "open">
```

Keep each field to one or two lines. Write the literal fallback shown above when a field has nothing.

## Step 2: ship to the toolkit

Detect whether `canon` is on PATH:

```bash
command -v canon >/dev/null 2>&1
```

If present, pipe the block to `canon feedback`. The CLI writes to its own repo's `.canon/review/feedback/feedback-<slug>-<ts>.md` and prints the absolute path on stdout:

```bash
cat <<'EOF' | canon feedback
## Toolkit feedback

...
EOF
```

Report the printed path back to the user on its own line, in the form the project's instruction file sets under `## Output`.

For a durable, cross-machine report instead of local scratch, add `--github`. The CLI opens a GitHub issue on the toolkit repo and prints the issue URL. It needs `gh` authenticated, and falls back to local scratch with a warning when `gh` is absent.

```bash
cat <<'EOF' | canon feedback --github
## Toolkit feedback

...
EOF
```

Default to local scratch for a quick note. Use `--github` for a report worth tracking across sessions and machines.

If `canon` is not on PATH, fall back: print the block in chat and tell the user `📋 Copy the block above into a toolkit-repo session.`

## Notes

- `canon feedback` resolves the toolkit root from the running `canon` binary's source location. If multiple toolkit clones exist on the machine, the first `canon` on PATH wins.
- The destination `.canon/review/` is gitignored in the toolkit repo. Feedback lives as session scratch for the next toolkit-side triage, not as a durable archive.
