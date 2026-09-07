---
title: Plugin catalog
description: Curated community and official Claude Code plugins that setup-plugins installs
---

# Plugin catalog

Curated domain-knowledge plugins the `setup-plugins` skill installs user-scoped.
Each row is verified to install through the `claude plugin` CLI. This file holds
only the actionable install data.

## Install data

Add the marketplace source once, then install the plugin by name. The CLI resolves
the plugin across added marketplaces, so `<name>@<marketplace>` is only needed to
disambiguate a name that exists in more than one marketplace.

| Plugin              | Category  | Marketplace source       | Why                                                                  |
| ------------------- | --------- | ------------------------ | -------------------------------------------------------------------- |
| `frontend-design`   | design    | `anthropics/claude-code` | Steers UI generation toward intentional typography, hierarchy, color |
| `security-guidance` | security  | `anthropics/claude-code` | Security-aware authoring guidance during code generation             |
| `code-review`       | review    | `anthropics/claude-code` | Multi-agent PR review across compliance, bugs, history, and comments |
| `superpowers`       | debugging | `obra/superpowers`       | Methodology skills: systematic-debugging, root-cause-tracing         |

## Recommended default

The `design` and `security` categories cover the common gaps for a new machine.
When the user asks for a recommended set, propose `frontend-design` and
`security-guidance`. Offer `code-review` and `superpowers` as additions.

`code-review` overlaps the toolkit's own `review-branch` skill. They run in
different places, the plugin on a PR and the toolkit skill on a local diff. Install
`code-review` only when the user wants the GitHub-side flow too.

## Installs outside the claude plugin CLI

Some strong plugins do not distribute through a marketplace, so the `claude plugin`
path does not reach them. List them here with their real installer. Surface them to
the user during selection, but do not run their install through the marketplace
step above. Run the installer command verbatim only when the user picks it.

| Plugin       | Category | Installer                       | Why                                                               |
| ------------ | -------- | ------------------------------- | ----------------------------------------------------------------- |
| `impeccable` | design   | `npx impeccable skills install` | Curated anti-slop reference files, sharper than `frontend-design` |

`npx impeccable skills install` detects the Claude Code harness and installs into
`.claude/`. It may prompt, so it is not fully non-interactive. After install, run
`/impeccable init` and reload.

Install per project, not per machine. The skill invokes its scripts through paths
relative to the current project (`.claude/skills/impeccable/scripts/*.mjs`), so a
copy under `~/.claude/` cannot locate them once the working directory is a
different project. Re-run the installer in each project that wants impeccable.
