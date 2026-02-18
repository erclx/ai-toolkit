# AI Toolkit

Multi-agent CLI toolkit for enforcing git conventions, installing governance rules, and automating documentation and release workflows. Supports Gemini CLI and Claude Code as agent backends.

## Installation

### Gemini CLI

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link ./gemini
```

### Claude Code

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
claude --plugin-dir ./claude
```

## Gemini Commands

### Governance

- `/gov:rules` - Install context-aware Cursor governance rules based on detected stack.
- `/gov:standards` - Install project reference standards.
- `/gov:prompt` - Compile a master system prompt for external LLMs.

### Versioning and git

- `/git:commit` - Generate conventional commit messages from staged changes.
- `/git:branch` - Rename current branch to match conventional format.
- `/git:pr` - Generate a PR description and open a draft.

### Documentation

- `/docs:readme` - Sync README with codebase changes from main branch.

### Versioning and release

- `/release:changelog` - Generate a changelog entry from commit history.

### Development

- `/dev:apply` - Apply file changes from a chat response.
- `/dev:apply-cli` - Generate and apply changes using governance rules.

## Claude Commands

Claude Code plugin commands are in development. See `claude/` for current status.

## Architecture

Governance rules (`.cursor/rules/`) and standards (`standards/`) live at the repository root as the single source of truth. The compiler (`scripts/build-gov.sh`) bundles these into agent-specific command definitions under `gemini/commands/` and `claude/commands/`.

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
