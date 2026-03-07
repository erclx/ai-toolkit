# Snippets system

## Overview

Snippets are small, reusable prompts invokable from Claude or Gemini chat via the Chrome extension using `slug:prompt` format. Each snippet is a focused plain markdown file with no frontmatter and no structure requirements.

## Structure

```
snippets/          ← invokable prompt snippets
docs/
└── SNIPPETS.md    ← this file
```

## Conventions

- Filename is the slug: `claude-edit.md` → invoked as `claude-edit`
- Kebab-case, no capitals, no underscores
- Plain markdown only, no YAML frontmatter
- One focused purpose per snippet; if it needs sections it's a system prompt, not a snippet
- Sync to the Chrome extension from `snippets/`

## Snippets

| Slug            | Purpose                                    |
| --------------- | ------------------------------------------ |
| `chat-mode`     | Set tool behavior for Claude chat sessions |
| `claude-edit`   | Claude Code file edit format               |
| `review-mode`   | Senior engineer critique and assess mode   |
| `session-notes` | End-of-session decisions capture template  |

## Adding a snippet

Create a `.md` file in `snippets/` using a kebab-case slug as the filename. No other steps needed, sync picks it up automatically.
