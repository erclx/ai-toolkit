# AI Core Toolkit

This Gemini extension helps you with automated reconnaissance, atomic commits, and evidence-based PR generation.

## Installation

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link .
```

## Commands

- `/ai-toolkit.arch:scout` - Deep architectural reconnaissance to determine stack, intent, and health.
- `/ai-toolkit.git:commit` - Analyzes staged changes to generate a specific, conventional commit message.
- `/ai-toolkit.git:pr` - Generates a documentation-driven PR description and opens a draft.
- `/ai-toolkit.lint:spelling` - Agentic session to triage spellcheck errors and update dictionaries.
- `/ai-toolkit.setup:cspell` - Scaffold CSpell infrastructure, dictionaries, and scripts.
- `/ai-toolkit.setup:gemini` - Agentic session to scaffold Gemini configuration.
- `/ai-toolkit.write:changelog` - Generates a semantic changelog entry based on git history.