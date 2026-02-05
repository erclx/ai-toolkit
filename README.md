# AI Toolkit

Add governance to your codebase.
Use these tools to understand your project, manage versions, and automate discovery.

## Installation

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link .
```

## Setup

Install the governance rules:

```bash
/ai-toolkit.setup:rules
```

## Commands

### Architecture and discovery
- `/ai-toolkit.setup:rules` - Install Cursor governance rules in the local project.
- `/ai-toolkit.setup:cursor` - Create a sandbox to test governance rules.

### Versioning and writing

- `/ai-toolkit.git:commit` - Read staged changes to write atomic conventional commits.
- `/ai-toolkit.git:pr` - Write a documentation-focused PR description and open a draft.
- `/ai-toolkit.write:changelog` - Build a clean release history for humans.

### Quality and linting

- `/ai-toolkit.lint:spelling` - Fix spelling errors and update dictionaries.
- `/ai-toolkit.setup:cspell` - Set up CSpell, modular dictionaries, and git hygiene.
- `/ai-toolkit.setup:gemini` - Configure the .gemini folder with zero-trust architecture.

## Patterns

- **Ghost folder:** Isolate state in `.gemini/.tmp/`.
- **Zero-bloat:** Prioritize technical density over narrative.
- **Atomic history:** Treat commits and PRs as immutable records.