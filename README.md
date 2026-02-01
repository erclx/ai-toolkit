# AI Core Toolkit

This Gemini extension helps you with automated reconnaissance, atomic commits, and evidence-based PR generation.

## Installation

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link .
```

## Commands

- `/ai-toolkit.arch:scout` - Understand the project's structure, technologies used, and overall status.
- `/ai-toolkit.git:commit` - Analyzes staged changes and generates a clear, conventional commit message.
- `/ai-toolkit.git:pr` - Creates a pull request description based on its changes and opens it as a draft.
- `/ai-toolkit.lint:spelling` - Fixes spelling mistakes and updates the project's spellcheck dictionary.
- `/ai-toolkit.setup:cspell` - Sets up CSpell (a spell checker) for the project, including its configuration and custom dictionaries.
- `/ai-toolkit.setup:gemini` - Sets up the basic configuration files for Gemini.
- `/ai-toolkit.write:changelog` - Automatically creates a new entry for the project's changelog based on its recent git commits.