---
name: toolkit-issue
description: Format a bug or task from the current session into a GitHub issue body and file it on the toolkit repo via `aitk issue create` with a `bug` or `enhancement` label. Use when asked to "file an issue", "open an issue", "log this bug", "track this as an issue", or "raise a toolkit issue" during toolkit development. Do NOT use to report that a toolkit surface broke from a target project (that is `toolkit-feedback`), or to triage existing issues (that is `toolkit-triage`).
---

# Toolkit issue

Format a bug or task from session context into a GitHub issue body, then file it on the toolkit repo with `aitk issue create`. This is the general counterpart to `toolkit-feedback`, which files `feedback`-labeled reports from a target project.

## Guards

- If nothing in session context describes a concrete bug or task, stop: `❌ No issue in session context. Describe the bug or task, then re-invoke.`
- If the type is ambiguous between a bug and a task, ask one line before formatting.
- Do not probe the project, list files, grep, or read toolkit surfaces. Use only what the session already contains.

## Step 1: build the block

From the conversation so far, identify:

- Type: `bug` or `task`
- Title: one line naming the defect or the work
- Area: the toolkit surface (plugin skill, snippet, CLI, script, standard, seed, or governance rule), or `unclear`
- Detail: what is wrong for a bug, or what to build for a task
- Repro or context: commands and steps for a bug, or the driving reason for a task, or `none`
- Proposed fix or approach when the session states one, or `open`

Format as a single fenced markdown block:

```markdown
## <Bug or Task>

**Area:** <surface, or "unclear">
**Detail:** <one or two lines>
**Repro or context:** <commands, steps, or reason, or "none">
**Proposed:** <one line, or "open">
```

Keep each field to one or two lines. Write the literal fallback shown above when a field has nothing.

## Step 2: file the issue

Detect whether `aitk` is on PATH:

```bash
command -v aitk >/dev/null 2>&1
```

If present, pipe the block to `aitk issue create` with a title and a label. Map a bug to `--label bug` and a task to `--label enhancement`, and prefix the title with the type. The CLI opens the issue on the toolkit repo and prints the issue URL on stdout:

```bash
cat <<'EOF' | aitk issue create --title "bug: <title>" --label bug
## Bug

...
EOF
```

Report the printed URL back to the user on its own line so the terminal makes it clickable.

If `aitk` is not on PATH, fall back: print the block in chat and tell the user `📋 Copy the block above into a toolkit-repo session, or file it with gh issue create.`

## Notes

- `aitk issue create` resolves the toolkit root from the running `aitk` binary's source location and files there, the same repo `aitk feedback --github` targets. It does not file on the current project.
- The `bug` and `enhancement` labels are GitHub defaults present on a fresh repo. A label that does not exist makes `gh` reject the issue. Create it once with `gh label create` if needed.
- Filed issues carry `bug` or `enhancement`, not `feedback`, so they stay out of the `toolkit-triage` feedback queue by design.
