---
name: toolkit-feedback
description: Formats a structured paste-back report from the current session when the user hits something broken, missing, or off in the ai/toolkit (plugin skill, snippet, tooling config, governance rule, seed, CLI). Output is a fenced block the user copies into a toolkit-repo session to drive the fix. Use when asked to "report toolkit issue", "toolkit feedback", "write this up for the toolkit", or "format this for the toolkit repo". Do NOT use for general bugs in the current project unrelated to the toolkit.
---

# Toolkit feedback

## Guards

- If nothing in session context points to a toolkit issue, stop: `❌ No toolkit issue in session context. Describe what broke, then invoke.`
- Do not probe the project. Do not list files, grep, or read installed toolkit surfaces. Use only what the session already contains.
- Do not write files. Output to chat only.

## Step 1: extract from session context

From the conversation so far, identify:

- Target project name or path
- Toolkit surface at issue and its type: plugin skill, snippet, tooling config, governance rule, seed, CLI
- Specific toolkit file or name when the session cites one (e.g., `claude/skills/claude-review/SKILL.md`)
- Observed behavior
- Expected behavior, or `unclear`
- Repro details already in context: commands run, files touched
- Proposed fix when the user stated one, or `open`

If the surface type is ambiguous, ask one line before formatting. Do not guess.

## Step 2: emit the report

Output a single fenced block so the user can copy it cleanly:

```markdown
## Toolkit feedback

**From project:** <name or path>
**Surface:** <type> — <file path or name>
**Observed:** <one or two lines>
**Expected:** <one or two lines, or "unclear">
**Repro:** <commands or steps, or "none">
**Proposed fix:** <one line, or "open">
```

Fill each field from session context. Keep each to one or two lines. If a field has nothing, write the literal fallback shown above, not an empty line.

## Step 3: close

After the block, print one line: `📋 Copy the block above into a toolkit-repo session.`
