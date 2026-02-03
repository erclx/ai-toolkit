# AI Core Toolkit

This extension transforms any codebase into a high-governance environment. 
It delivers a suite of utilities for deep codebase understanding, semantic versioning, and automated project discovery.

## Installation

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link .
```

## Setup

Install governance rules:

```bash
/ai-toolkit.setup:rules
```

## Commands

### Architecture & Discovery

- `/ai-toolkit.arch:scout` - Deep architectural reconnaissance to determine stack, intent, and health.
- `/ai-toolkit.setup:rules` - Installs Cursor governance rules into the local project.
- `/ai-toolkit.setup:cursor` - Prepares sandbox environment with governance rules for testing.

### Versioning & Writing

- `/ai-toolkit.git:commit` - Analyzes staged changes to generate atomic, lowercase conventional commits.
- `/ai-toolkit.git:pr` - Generates a documentation-driven PR description and opens a draft.
- `/ai-toolkit.write:changelog` - Curates release history, filtering out internal noise for human consumption.

### Quality & Linting

- `/ai-toolkit.lint:spelling` - Agentic session to triage spellcheck errors and update dictionaries.
- `/ai-toolkit.setup:cspell` - Scaffolds CSpell infrastructure, modular dictionaries, and git hygiene.
- `/ai-toolkit.setup:gemini` - Configures the .gemini infrastructure using a "Zero-Trust" architecture.

## Patterns

- **Ghost Folder:** State is isolated in `.gemini/.tmp/`.
- **Zero-Bloat:** Commands prioritize technical density over narrative fluff.
- **Atomic History:** Commits and PRs are treated as immutable technical records.