---
name: toolkit-cli
description: Reference for what aitk sync and install commands overwrite, merge, or leave untouched in a target project. Use before running `aitk tooling`, `aitk standards`, `aitk claude sync`, or `aitk init`, or when asked "will this overwrite my changes". Do NOT use to run the commands, only to know their effect.
---

# Toolkit CLI contract

What each `aitk` sync or install command does to existing files in a target project. Consult before running one, then warn the user about anything destructive. This skill is reference only. It does not run commands.

## Overwrite contract

| Surface                                                     | Command                  | Effect on existing files                                          |
| ----------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| Golden configs (eslint, prettier, vite, tsconfig, ruff)     | `aitk tooling sync`      | Always overwritten. Local edits are lost. Drift is intentional.  |
| Dictionary seeds (`.cspell/*.txt`)                          | `aitk tooling sync`      | Merged and sorted. Existing terms preserved.                     |
| Other seeds (`cspell.json`, `.lintstagedrc`, state docs)    | `aitk tooling sync`      | Copy-once. Dropped on first install, untouched after.            |
| Standards                                                   | `aitk standards install` | All overwritten.                                                 |
| Standards                                                   | `aitk standards sync`    | Only files already present are updated. None are added.          |
| Seed docs and `CLAUDE.md`                                   | `aitk claude init`       | Skipped when present. Never overwritten.                         |
| Seed docs                                                   | `aitk claude sync`       | Never touched.                                                   |
| Role prompts                                                | `aitk claude sync`       | Synced only when already present.                                |
| References (`.claude/tooling/<stack>.md`)                   | `aitk tooling ref`       | Overwritten.                                                     |
| `.gitignore`, deps, scripts                                 | any sync                 | Additive. Existing entries preserved. Deps re-pin on major skew. |
| Generated `index.md`                                        | any sync or regen        | Rewritten from target state. Hand edits are lost.                |

## Rules

- Before `aitk tooling sync`, know golden configs always overwrite. When the project carries local edits to a golden config, warn the user before running it.
- Seeds are user-owned. Dictionary `.txt` files merge and sort. Other seeds are copy-once, so re-seeding a structured file means deleting it and syncing again.
- Prefer `aitk standards sync` over `install` on an existing project. `install` overwrites every standard.
- For section-level customizations of a standard or seed doc, use the `claude-seed-sync` skill, not `aitk ... sync`. It diffs per section and preserves edits.

## CLAUDE.md

- `CLAUDE.md` is a copy-once seed. No `aitk` sync command ever updates it. Reconcile it with the `claude-seed-sync` skill, which diffs the preamble and each section and preserves customizations by default.

## Source of truth

- Full semantics live in the toolkit's `.claude/context/tooling.md`, `standards.md`, and `claude.md`. This skill is the target-session summary. When they disagree, the context docs win.
