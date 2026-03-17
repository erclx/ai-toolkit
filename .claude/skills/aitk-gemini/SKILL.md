---
name: aitk-gemini
description: Gemini CLI command definitions in TOML. Use for adding or modifying commands, categories, or sandbox tests.
---

# Gemini

## Commands

- Commands are deterministic scripts with zero AI tokens. No variability, no inference.
- Each command is a `.toml` file. Structure and required fields are defined in `prompts/gemini-cli.md`.
- Commands are organized by category. Read `docs/gemini.md` for existing categories and commands before adding.
- Commands are invoked as `/category:command` in Gemini CLI.

## Sync checklist

When adding a new command:

- Create `.toml` in `gemini/commands/<category>/`
- Create corresponding `scripts/sandbox/<category>/<cmd>.sh`
- Add the command to the commands table in `docs/gemini.md`

When modifying a command:

- Verify the corresponding sandbox test still reflects the change
- Update the commands table in `docs/gemini.md` if the description changed

When adding a new category:

- Create the category folder in both `gemini/commands/` and `scripts/sandbox/`
- Add the category and command to `docs/gemini.md`

## Full reference

- `docs/gemini.md`: commands inventory, setup, adding commands
- `prompts/gemini-cli.md`: full conventions for command structure and TOML format
