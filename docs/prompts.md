# Prompts system

## Overview

Prompts are system prompt generators for AI-assisted authoring tasks. Each prompt defines a role, constraints, and output format for generating a specific artifact type. They are machine-readable specs optimized for token efficiency and deterministic output.

## Structure

```plaintext
prompts/          ← system prompt generators
docs/
└── prompts.md    ← this file
```

## Prompts

| File                     | Generates                                    |
| ------------------------ | -------------------------------------------- |
| `bash-script.md`         | Production-grade Bash scripts with visual UI |
| `claude-skill.md`        | Claude Code skill SKILL.md files             |
| `cursor-rules.md`        | Cursor .mdc rule files                       |
| `gemini-cli.md`          | Gemini CLI TOML command files                |
| `meta-prompt.md`         | System prompts from raw user ideas           |
| `standards-reference.md` | Standards reference markdown files           |
| `tooling-reference.md`   | Tooling stack reference.md files             |

## Conventions

- All-caps H1 title: `# BASH SCRIPT ARCHITECT`
- All-caps H2 sections: `## ROLE`, `## CRITICAL CONSTRAINTS`
- Title case H3 subsections: `### Must Do`, `### Must Not Do`
- Every prompt includes `## ROLE`, `## CRITICAL CONSTRAINTS`, `## OUTPUT FORMAT`
- Include `## VALIDATION` when the output involves multi-step logic or edge cases

## Adding a prompt

Create a `.md` file in `prompts/` following the all-caps heading convention. Include role, constraints, output format, at least one complete example, and a validation checklist if the output is complex.
