---
name: experiment
description: Scaffolds a hands-on tool investigation at `.claude/.tmp/<tool>/notes.md` with a phased template and an evidence folder. Use when asked to "start an experiment", "investigate a tool", or "scaffold an investigation" on a new tool, API, or product.
disable-model-invocation: true
---

# Experiment

Scaffold a tool-investigation notes file at a predetermined path. The template drives a phased protocol that ends in a wiki-ready synthesis block. Every value starts as `?` and is promoted to fact only after direct observation (screenshot, command output, API response).

## Guards

- If no tool name is provided, stop: `❌ No tool name. Invoke with a tool to investigate, e.g. /experiment stitch.`
- Normalize the tool name: lowercase, replace spaces with `-`. `Claude Design` becomes `claude-design`.
- If `.claude/.tmp/<tool>/notes.md` already exists, stop: `❌ Experiment notes already exist at .claude/.tmp/<tool>/notes.md. Delete the folder to start over.`

## Scaffold

Run in order:

- Create the directory tree: `mkdir -p .claude/.tmp/<tool>/evidence`
- Copy this skill folder's `assets/notes-template.md` verbatim to `.claude/.tmp/<tool>/notes.md`. Do not substitute `<tool>` tokens. The human fills them in while verifying each claim.

## Response format

Print two lines:

- `📝 Scaffolded .claude/.tmp/<tool>/notes.md`
- `Save evidence to .claude/.tmp/<tool>/evidence/ as you verify each claim.`

Stop after printing. Do not fill in any template fields.
