# Claude Code skills

A skill is a reusable instruction set that extends Claude's behavior. Skills are defined in a `SKILL.md` file with YAML frontmatter and markdown content. Unlike built-in commands which execute fixed logic, skills let Claude orchestrate work with its tools: reading files, running commands, and adapting to context. A skill you define in `.claude/skills/` becomes a `/command` invoked the same way as any built-in. See [Claude Code commands](claude-commands.md) for the full list of what ships built-in.

## Invocation

Invoke a skill manually with `/skill-name`. Plugin skills are namespaced: `/plugin-name:skill-name`. Skills can be user-invoked, auto-triggered, or both.

Auto-triggering is the default. Claude loads a skill when it matches the current request. Set `disable-model-invocation: true` in frontmatter to prevent this. The skill then only runs when you invoke it explicitly.

Skill descriptions load into context at session start so Claude knows what is available. Full skill content loads only when the skill is invoked.

## Installation locations

Skills are discovered from multiple locations. Higher priority wins when names conflict:

- Enterprise (managed settings): all users in the organization
- Personal (`~/.claude/skills/<skill-name>/SKILL.md`): all your projects
- Project (`.claude/skills/<skill-name>/SKILL.md`): this project only
- Plugin (`<plugin>/skills/<skill-name>/SKILL.md`): where the plugin is installed

Nested `.claude/skills/` directories in subdirectories are discovered automatically, which works for monorepos where packages have their own skills.

## Frontmatter

```yaml
---
name: skill-name
description: what it does and when Claude should use it
disable-model-invocation: true # user-invoked only
allowed-tools: Read, Grep, Glob # restrict tool access
---
```

The `description` field is critical. Claude routes based on it alone when deciding whether to auto-trigger.

## Plugins

A plugin is a packaged distribution of skills, hooks, agents, and MCP servers. Plugins live in their own directory with a `plugin.json` manifest and namespace their components to prevent conflicts.

Install plugins via `/plugin` or by referencing them in settings. Use `/reload-plugins` to pick up changes after updates.

Plugin structure:

```plaintext
my-plugin/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── my-skill/
        └── SKILL.md
```

Skills in `my-plugin` are invoked as `/my-plugin:my-skill`.
