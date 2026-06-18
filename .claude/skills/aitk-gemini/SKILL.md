---
name: aitk-gemini
description: Gemini CLI command definitions in TOML. Use for adding or modifying commands, categories, or sandbox tests.
---

# Gemini

Read `.claude/context/gemini.md` for existing categories and commands before adding.

## Sync checklist

When adding a new command:

- Create `.toml` in `gemini/commands/<category>/`
- Create corresponding `scripts/sandbox/<category>/<cmd>.sh`
- Add the command to the commands table in `.claude/context/gemini.md`

When modifying a command:

- Verify the corresponding sandbox test still reflects the change
- Update the commands table in `.claude/context/gemini.md` if the description changed
- Check if a corresponding plugin skill exists in `claude/skills/` and update it to match

When adding a new category:

- Create the category folder in both `gemini/commands/` and `scripts/sandbox/`
- Add the category and command to `.claude/context/gemini.md`

When editing `tooling/gemini/seeds/`:

- Check the root `.gemini/` and `GEMINI.md` for drift. The toolkit dogfoods its own gemini seeds.
- Port the delta, preserving local overrides in the root copy.

## Reference

- `.claude/context/gemini.md`: commands inventory, setup, adding commands
- `prompts/gemini-cli.md`: full conventions for command structure and TOML format
