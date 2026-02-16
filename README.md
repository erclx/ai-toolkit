# AI Toolkit

Gemini CLI extension for enforcing git conventions, installing governance rules, and automating documentation and release workflows.

## Installation

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link .
```

## Commands

### Architecture and discovery

- `/ai-toolkit.setup:rules` - Install governance rules in the local project.
- `/ai-toolkit.setup:cursor` - Create a sandbox for testing governance rules.

### Governance

- `/ai-toolkit.gov:rules` - Install context-aware Cursor governance rules based on detected stack.
- `/ai-toolkit.gov:standards` - Install project reference standards.
- `/ai-toolkit.gov:prompt` - Compile a master system prompt for external LLMs.

### Versioning and git

- `/ai-toolkit.git:commit` - Generate conventional commit messages from staged changes.
- `/ai-toolkit.git:branch` - Rename current branch to match conventional format.
- `/ai-toolkit.git:pr` - Generate a PR description and open a draft.

### Documentation

- `/ai-toolkit.docs:readme` - Sync README with codebase changes from main branch.

### Versioning and release

- `/ai-toolkit.release:changelog` - Generate a changelog entry from commit history.

### Development

- `/ai-toolkit.dev:apply` - Apply file changes from a chat response.
- `/ai-toolkit.dev:apply-cli` - Generate and apply changes using governance rules.
