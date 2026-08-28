---
name: bash-script
description: Scope boundary for the interactive script house style and the stream discipline underneath it
---

# Bash script requirement

## Gap

Without this skill, a session asked for a human-facing shell tool writes one whose frame decoration, log lines, and prompts all land on stdout, so the script cannot be piped and any data it emits arrives mixed with its own presentation.

Three more failures share a cause, which is that an interactive script is written as though a person is always watching. A prompt blocks forever when stdin is not a terminal, which is the shape every CI job and every agent run has. A cancellation path prints both a cancel line and an error, or an exit trap prints a closing frame the success path already printed, so the same run reports twice. And each generated script picks its own icons, casing, and frame characters, so a folder of them reads as several unrelated tools.

The visual conventions this skill fixes are otherwise arbitrary. Their value is that they are the same across every script, which is a property no individual script can establish for itself.

## Must

- Keep every frame, log line, and prompt on stderr, and reserve stdout for data. `--help` is the one exception, since its consumer is a person rather than a pipe.
- Guard every prompt on an attached terminal and refuse inside the frame rather than blocking on a read that will never return
- Give the timeline one owner per exit path, so success, cancellation, and error each close it exactly once
- Copy the shared templates rather than restating them, keeping only the colors and functions the script uses

## Must not

- Assert a convention the generated script cannot be checked against by reading it. A rule that cannot be verified from the output is style with no gate behind it.
- Carry a second copy of the timeline, logging, or prompt implementations. The bundled reference is the single copy, and a body that restates it drifts from it.

## Guards

- A request for a script with no human at the terminal stops and routes to `bash-cli-script` rather than generating a timeline nothing will render

## Out of scope

- Non-interactive automation, CI, and agent-run scripts: `bash-cli-script`, which keeps the error handling and the stdout contract and drops the timeline, the icons, and the prompts
- GitHub Actions workflow files: `ci-workflow`
- What the generated script does. This skill fixes the shape of the output and the stream it goes to, and the commands belong to the request.
