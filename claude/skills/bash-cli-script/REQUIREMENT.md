---
name: bash-cli-script
description: What a non-interactive automation script owes its caller, and the stdout contract that separates it from the human-facing generator
---

# Bash CLI script requirement

## Gap

Without this skill, an automation script is written with an interactive tool's habits. Progress frames, icons, and color land on stdout, so the script stops composing in a pipe and the caller parses a spinner as data. The failure is invisible in a terminal and total in CI.

The robustness failures are the ones that reach production. Without strict mode a failed stage inside a pipe exits zero and the script reports success on work that did not happen.

An unset variable expands to nothing and a path built from it points somewhere nobody meant. Errors print and execution continues. And a single long `main()` holding every responsibility cannot be tested or reused, which is what turns a one-off script into one nobody will touch.

## Must

- Open with the strict-mode preamble, so a failed stage stops the script
- Keep data on stdout and put every log line, progress message, and error on stderr
- Exit non-zero with actionable context through one error helper
- Default every variable expansion rather than relying on it being set
- Guard a command that returns non-zero on a valid empty result
- Decompose by responsibility, with the entry function orchestrating rather than doing
- Implement usage and the help flags when the script takes arguments
- Run the validation list before responding

## Must not

- Emit timeline frames, icons, color, or an interactive prompt
- Put a log or progress line on stdout
- Comment what the code already states
- Leave stdout formatted for a human to read

## Guards

- No refusal condition. Every request within scope generates, and the boundary against the interactive generator is a routing call made at invocation rather than a runtime stop.

## Out of scope

- A human-facing interactive tool with prompts or a visual timeline UI, which `bash-script` owns
- A GitHub Actions workflow file, which `ci-workflow` owns
- Running, installing, or scheduling what it generates
