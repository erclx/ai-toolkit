# Skills system

## Overview

Skills provide Claude Code with domain-specific constraints and rules inline, so it can act immediately without reading all docs. Each skill body contains actionable rules for its domain. Full reference docs are the fallback for edge cases and deeper context. Skills use progressive disclosure: Claude reads only frontmatter at session start (~100 tokens each), matches a query against descriptions, then loads the full skill body.

## Structure

```plaintext
.claude/skills/        ← internal skills, toolkit repo only
claude/skills/         ← plugin skills, installable in target projects
```

Internal skills are available in the toolkit repo only. Plugin skills are namespaced as `toolkit:skill-name` and available in any project that loads the plugin.

## Internal skills

| Skill             | Full reference                                                              |
| ----------------- | --------------------------------------------------------------------------- |
| `aitk-prompts`    | `docs/prompts.md`, `prompts/meta-prompt.md`                                 |
| `aitk-scripts`    | `docs/scripts.md`, `docs/sandbox.md`, `prompts/bash-script.md`              |
| `aitk-standards`  | `docs/standards.md`, `standards/prose.md`, `prompts/standards-reference.md` |
| `aitk-snippets`   | `docs/snippets.md`                                                          |
| `aitk-gemini`     | `gemini/README.md`, `prompts/gemini-cli.md`                                 |
| `aitk-governance` | `docs/governance.md`, `prompts/cursor-rules.md`                             |
| `aitk-tooling`    | `docs/tooling.md`, `prompts/tooling-reference.md`                           |
| `aitk-claude`     | `claude/README.md`, `standards/skill.md`                                    |

## Plugin skills

| Skill                | Full reference                          |
| -------------------- | --------------------------------------- |
| `toolkit:git-commit` | `standards/commit.md`                   |
| `toolkit:git-pr`     | `standards/pr.md`, `standards/prose.md` |
| `toolkit:git-branch` | `standards/branch.md`                   |

## Invocation

Skills auto-trigger when Claude matches a query against the description. Invoke manually with `/skill-name` or `/toolkit:skill-name` for plugin skills.

Priority order when names conflict: enterprise > personal > project > plugin.

## Adding a skill

Run `/skill-creator` and follow `standards/skill.md`.
