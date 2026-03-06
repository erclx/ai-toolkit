# Tooling Gemini reference

## Overview

The gemini stack seeds `.gemini/settings.json` with a baseline model config into a project.

## Settings

- Config: `.gemini/settings.json` at root.
- Model: `gemini-2.5-flash` (default seed, user-owned after init).
- Gitignored — local override, never commit.

## Gitignore

- `# Gemini` — `.gemini/.tmp/`, `.gemini/settings.json`
