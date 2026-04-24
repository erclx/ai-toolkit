Format a paste-back report about something broken, missing, or off in the ai/toolkit using only what the current session already contains. Do not probe the project, list files, grep, or read toolkit surfaces.

From the conversation so far, identify the target project name or path, the toolkit surface at issue and its type (plugin skill, snippet, tooling config, governance rule, seed, or CLI), a specific toolkit file or name when the session cites one, the observed behavior, the expected behavior or `unclear`, any repro details already in context such as commands run or files touched, and a proposed fix when the user stated one or `open`.

If the surface type is ambiguous, ask one line before formatting. Do not guess.

Emit a single fenced block so the user can copy it cleanly:

```markdown
## Toolkit feedback

**From project:** <name or path>
**Surface:** <type>, <file path or name>
**Observed:** <one or two lines>
**Expected:** <one or two lines, or "unclear">
**Repro:** <commands or steps, or "none">
**Proposed fix:** <one line, or "open">
```

Fill each field from session context. Keep each to one or two lines. Write the literal fallback shown above when a field has nothing.

After the block, print one line: `📋 Copy the block above into a toolkit-repo session.`

If nothing in session context points to a toolkit issue, stop with `❌ No toolkit issue in session context. Describe what broke, then invoke.`
