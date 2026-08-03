---
title: Scripting
description: The runtime catalogs that replace hardcoded names, what each carries, and a headless invocation per domain
---

# Scripting

What a skill or script reads to discover names at runtime, and how each domain is invoked with no TTY.

## Runtime catalogs

Use these to discover what's available instead of hardcoding names.

| Command                          | Returns                                       |
| -------------------------------- | --------------------------------------------- |
| `aitk tooling list --json`       | Stacks, extends chain, dep and script counts  |
| `aitk snippets list --json`      | Presets and categories with their slugs       |
| `aitk standards list --json`     | Standards docs and the paths each governs     |
| `aitk gov list --json`           | Governance stacks and rule sets               |
| `aitk claude seeds list --json`  | Seed doc sources with content                 |
| `aitk claude skills list --json` | Plugin skills, descriptions, requirement flag |
| `aitk docs list --json`          | Consumer docs plus per-domain context         |

### Catalog fields

Every catalog serializes through `JSON.stringify`, so a name carrying a quote
emits valid JSON. `aitk tooling list` and `aitk snippets list` previously built
their output with `printf` and no escaping.

`aitk standards list` carries `appliesTo` per standard, the paths that standard's
`## Scope` statement declares. It holds the backticked paths from the first
sentence of the statement, the single entry `*` for a standard governing an
attribute rather than a document type, and an empty array when the statement
declares nothing a parser can read. A consumer mapping a file to its governing
standards reads this rather than holding a table of its own, and reports an empty
array rather than skipping the standard behind it.

`aitk claude seeds list` reads the same plan `aitk claude init` applies, so the
listing and the install cannot disagree. It now reports
`.claude/context/index.md`, which `init` has always installed and the listing
never named, and it emits the project-level `CLAUDE.md` last rather than first.

### The skills catalog

`aitk claude skills list` reads `claude/skills/*/SKILL.md` and reports the folder
name with the frontmatter description, sorted by name. Internal skills under
`.claude/skills/` are excluded, since they never install into a target and a
count spanning both overstates what ships. A skill whose frontmatter is missing
or unparseable returns an empty description rather than failing the listing, so
one malformed file cannot hide the rest of the catalog. `--names` emits skill
names one per line.

Each entry also carries `requirement`, whether the folder holds a sibling
`REQUIREMENT.md`. Every skill is meant to carry one, so a `false` is a gap to
close rather than a recorded exemption, and the flag answers which skills are
missing theirs without a caller listing the directory itself. Nothing gates the
rule yet, which is why the flag is worth reading against the shipped corpus after
a merge.

## Non-interactive examples

```bash
# Create a new tooling stack
AITK_NON_INTERACTIVE=1 aitk tooling create astro

# Sync a stack into a target project
AITK_NON_INTERACTIVE=1 aitk tooling sync astro /path/to/project

# Install a governance stack (the stack argument is required headlessly)
AITK_NON_INTERACTIVE=1 aitk gov install astro --add 260-shadcn /path/to/project

# Update installed governance rules, dropping a retired .claude/GOV.md
AITK_NON_INTERACTIVE=1 aitk gov sync /path/to/project

# Concatenate installed rules into a paste payload
AITK_NON_INTERACTIVE=1 aitk gov build /path/to/project

# Sync a monorepo subtree, skipping the base layer the repo root already owns
AITK_NON_INTERACTIVE=1 aitk tooling sync vite-react /path/to/repo/frontend --skip base

# Verify a stack end-to-end in a throwaway scaffold
aitk tooling verify vite-react

# Apply one stack without scanning or prompting, for scripted provisioning
aitk tooling inject base /path/to/project
aitk tooling inject base /path/to/project --configs --seeds

# Drop managed gitignore entries a manifest no longer declares
# Prints the number removed on stdout, diagnostics on stderr
aitk tooling prune-gitignore base /path/to/project

# Install a snippet preset
AITK_NON_INTERACTIVE=1 aitk snippets install essentials /path/to/project

# Update snippets already installed, leaving project-authored ones alone
AITK_NON_INTERACTIVE=1 aitk snippets sync /path/to/project

# Report standards drift without applying it, which is what headless does here
AITK_NON_INTERACTIVE=1 aitk standards sync /path/to/project

# Copy every standard into a target, overwriting what is there
AITK_NON_INTERACTIVE=1 aitk standards install /path/to/project

# Install a named subset, expanded to the standards it cites
AITK_NON_INTERACTIVE=1 aitk standards install --only slug /path/to/project

# Bootstrap a project. Any flag suppresses the confirmation prompt
AITK_NON_INTERACTIVE=1 aitk init --stack astro --skip wiki /path/to/project
AITK_NON_INTERACTIVE=1 aitk init --standards design,wireframes /path/to/project

# Run every domain sync. The git workflow is refused headlessly, so nothing is pushed
AITK_NON_INTERACTIVE=1 aitk sync /path/to/project

# Scaffold .claude/wiki/ with a stub index. The target must already exist
AITK_NON_INTERACTIVE=1 aitk wiki init /path/to/project

# Run a sandbox scenario non-interactively
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling
```
