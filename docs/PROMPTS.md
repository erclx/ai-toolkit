# Prompt System

## Overview

The prompt system generates master prompts by injecting installed governance rules into a template. Two templates exist: one for the Gemini CLI (agentic, runs tools directly) and one for chat interfaces (generates structured output a human pastes and applies). The output is a ghost file, gitignored and never committed.

## Structure

````
scripts/
├── manage-prompts.sh               ← entry point (gdev prompt)
└── templates/
    └── master-prompt-chat.template ← for chat interface sessions
```

Output writes to the target project at runtime:

````

.gemini/.tmp/
└── master-prompt.md ← generated, gitignored, never committed

````

## Key Decisions

Rules come from the target project, not the toolkit. `gdev prompt` reads `.cursor/rules/` in the current working directory. Run `gdev gov sync` in the target project first to install the relevant rule set before generating a prompt.

A single template serves the chat workflow. `master-prompt-chat.template` assumes a human is the executor, structuring output as `# FILES / # VERIFY` blocks intended to be pasted into `apply.toml` for file application.

Prompts inject rules only. Standards sync separately via `gdev gov sync` and are not included in generated prompts. Frontmatter is stripped from each `.mdc` file, rules are concatenated with separators, and the payload replaces `{{GOVERNANCE_RULES}}`.

Output is ephemeral. `.gemini/.tmp/` and `.gemini/settings.json` are gitignored. The master prompt is regenerated per session, reflects whatever rules are currently installed, and can be edited mid-session without affecting the source rules.

## CLI

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `gdev prompt`          | Generate a master prompt using the chat template |
| `gdev prompt generate` | Same as `gdev prompt`                            |

`gdev prompt` lists installed rules, then asks for confirmation before generating.

## Workflow

Typical session setup:

```bash
gdev gov sync ../my-app   # sync rules and standards to project
gdev prompt               # confirm, generate
```

For chat sessions, copy `.gemini/.tmp/master-prompt.md` as the system prompt in your chat interface. After the model responds with `# FILES / # VERIFY` blocks, apply the output with:

```bash
gemini dev:apply "<paste response>"
```

## Adding or Changing Templates

Templates live in `scripts/templates/`. Each must contain the `{{GOVERNANCE_RULES}}` placeholder at the line where injected rules should appear. Everything above that line is the header; everything below is the footer. No other syntax is required.

## Notes

- Run `gdev gov sync` before `gdev prompt` when switching projects or stacks.
- The generated prompt includes raw rule content, so review it before a sensitive session.
- Add `.gemini/.tmp/` and `.gemini/settings.json` to `.gitignore` if missing.
````
