# Skills system

## Overview

Skills are thin pointers that route Claude to the right docs automatically. They use progressive disclosure: Claude reads only frontmatter at session start (~100 tokens each), matches a query against descriptions, then loads the full skill body and follows the file references inside it. No content is duplicated in skills. Docs are the source of truth.

## Structure

```plaintext
.claude/skills/        ← internal skills, toolkit repo only
claude/skills/         ← plugin skills, installable in target projects
```

Internal skills are available in the toolkit repo only. Plugin skills are namespaced as `toolkit:skill-name` and available in any project that loads the plugin.

## Internal skills

| Skill             | Points to                                                                         |
| ----------------- | --------------------------------------------------------------------------------- |
| `aitk-prompts`    | `docs/prompts.md`, `prompts/meta-prompt.md`                                       |
| aitk-scripts      | `docs/scripts.md`, `docs/sandbox.md`, `docs/tooling.md`, `prompts/bash-script.md` |
| `aitk-standards`  | `docs/standards.md`, `standards/prose.md`, `prompts/standards-reference.md`       |
| `aitk-snippets`   | `docs/snippets.md`                                                                |
| `aitk-gemini`     | `prompts/gemini-cli.md`                                                           |
| `aitk-governance` | `docs/governance.md`, `prompts/cursor-rules.md`                                   |
| `aitk-tooling`    | `docs/tooling.md`, `prompts/tooling-reference.md`                                 |

## Plugin skills

| Skill                | Points to                               |
| -------------------- | --------------------------------------- |
| `toolkit:git-commit` | `standards/commit.md`                   |
| `toolkit:git-pr`     | `standards/pr.md`, `standards/prose.md` |
| `toolkit:git-branch` | `standards/branch.md`                   |

## Invocation

Skills auto-trigger when Claude matches a query against the description. Invoke manually with `/skill-name` or `/toolkit:skill-name` for plugin skills.

Priority order when names conflict: enterprise > personal > project > plugin.

## Adding a skill

Run `/skill-creator` and follow `standards/skill.md`.
