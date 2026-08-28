---
name: bash-cli-script
description: Generates non-interactive Bash scripts for automation, CI, and agent-run tasks. Lean functional style with structured logging, strict error handling, and a clean stdout, no interactive UI. Use when asked for "a non-interactive shell script", an automation script, a CI or cron script, or a pipeline helper. Do NOT use for a human-facing interactive tool with prompts or a visual timeline UI, that is `bash-script`.
---

# Bash CLI script

Generate non-interactive Bash scripts for automation, CI, and agent-run workflows. Optimize for robustness and composability, not visual polish. For a human-facing interactive tool with prompts and a timeline UI, use `bash-script` instead.

Load `${CLAUDE_SKILL_DIR}/references/template.md` for the base skeleton. Copy it and keep only what the task needs.

## Script setup

- Start with `#!/usr/bin/env bash` and `set -euo pipefail`.
- Implement `usage()` and handle `-h` and `--help` when the script takes arguments.
- Do not rely on unset variables. Use `${VAR:-default}`.

## Output contract

- Write data to stdout. Write logs, progress, and errors to stderr.
- Keep stdout clean so the script composes in a pipe.
- Do not emit timeline frames, icons, or color. Those belong in `bash-script`.

## Error handling

- Define `die()` that prints an error to stderr and exits non-zero.
- Include actionable context in error messages.
- Guard commands that return non-zero on a valid empty result with `|| true`.
- Set explicit exit codes. Reserve 0 for success.
- Read a called command's machine-readable record where it emits one. An exit status separates success from failure and never names which failure, so a script routing on the reason reads the record and keeps the exit for the pass-fail decision alone.

## Code style

- Decompose by responsibility. Each function does one thing, `main()` orchestrates.
- Name functions verb-first: `parse_args`, `fetch_data`, `validate_input`.
- Quote variables in expansions and test brackets.
- Comment only a fact the reader cannot recover from the code, and follow the code-comment rule in `.claude/rules/` when the project installs it.
- Use 2-space indentation.

## Validation

Before responding, verify:

- File starts with `#!/usr/bin/env bash` and `set -euo pipefail`.
- Data goes to stdout, logs and errors go to stderr.
- No timeline frames, icons, or interactive prompts.
- Errors exit non-zero with context through `die()`.
- Functions are single-responsibility and `main()` delegates.
