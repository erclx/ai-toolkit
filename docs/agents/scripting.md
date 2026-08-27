---
title: Scripting
description: The runtime catalogs that replace hardcoded names, what each carries, and a headless invocation per domain
---

# Scripting

What a skill or script reads to discover names at runtime, and how each domain is invoked with no TTY.

## Runtime catalogs

Use these to discover what's available instead of hardcoding names.

| Command                          | Returns                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `aitk tooling list --json`       | Stacks, extends chain, dep and script counts                     |
| `aitk snippets list --json`      | Presets and categories with their slugs                          |
| `aitk standards list --json`     | Standards docs and the paths each governs                        |
| `aitk gov list --json`           | Governance stacks, rule sets, and unreferenced rules             |
| `aitk claude seeds list --json`  | Seed doc sources with content                                    |
| `aitk claude skills list --json` | Plugin skills, descriptions, requirement flag                    |
| `aitk docs list --json`          | Consumer docs plus per-domain context                            |
| `aitk audits list --json`        | Audits the set runs, the corpus each reads, and whether it gates |

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

`aitk gov list` reports each stack's rules already expanded. A stack entry names
either a rule or a whole rule folder under `governance/rules/`, and the folder
form reaches this listing as the rules it stands for rather than as the folder
name. A consumer deduping `--add` extras against a stack therefore reads the same
set the install writes, whichever form the stack file uses.

It also carries `unreferenced`, the rules no stack reaches, on every invocation
rather than behind a flag. These install only through `--add`, so the key answers
what a stack leaves out without a caller resolving every stack itself. The key is
present alongside `stacks` and `rules` and survives `--stacks` or `--rules`
narrowing the other two.

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
missing theirs without a caller listing the directory itself. `aitk claude skills
audit` gates that rule across both corpora, so read this flag for the state of
the shipped catalog and the audit for whether a working tree conforms. Its
surface is in `skills-audit.md`.

## Non-interactive examples

```bash
# Create a new tooling stack
AITK_NON_INTERACTIVE=1 aitk tooling create astro

# Report what a stack would change, writing nothing
AITK_NON_INTERACTIVE=1 aitk tooling sync astro /path/to/project --check

# Sync a stack into a target project, overwriting its golden configs
AITK_NON_INTERACTIVE=1 aitk tooling sync astro /path/to/project --write

# Install a governance stack (the stack argument is required headlessly)
AITK_NON_INTERACTIVE=1 aitk gov install astro --add 260-shadcn /path/to/project

# Update installed governance rules, dropping a retired .claude/GOV.md
AITK_NON_INTERACTIVE=1 aitk gov sync /path/to/project

# Concatenate installed rules into a paste payload
AITK_NON_INTERACTIVE=1 aitk gov build /path/to/project

# Sync a monorepo subtree, skipping the base layer the repo root already owns
AITK_NON_INTERACTIVE=1 aitk tooling sync vite-react /path/to/repo/frontend --skip base --write

# Verify a stack end-to-end in a throwaway scaffold
aitk tooling verify vite-react

# Apply one stack without scanning or prompting, for scripted provisioning
aitk tooling inject base /path/to/project
aitk tooling inject base /path/to/project --configs --seeds

# Drop managed gitignore entries a manifest no longer declares
# Prints the number removed on stdout, diagnostics on stderr
aitk tooling prune-gitignore base /path/to/project

# Print one standard. Nothing installs the corpus, so this is how a target reads one
AITK_NON_INTERACTIVE=1 aitk standards slug >slug.md

# Bootstrap a project. Any flag suppresses the confirmation prompt
AITK_NON_INTERACTIVE=1 aitk init --stack astro --skip wiki /path/to/project

# Run every domain sync. The git workflow is refused headlessly, so nothing is pushed
AITK_NON_INTERACTIVE=1 aitk sync /path/to/project

# Scaffold .claude/wiki/ with a stub index. The target must already exist
AITK_NON_INTERACTIVE=1 aitk wiki init /path/to/project

# Run a sandbox scenario non-interactively
SANDBOX_SCENARIO=sync aitk sandbox infra:tooling

# Read every audit as one record. Exit 2 is a fact, 3 an audit that did not report
aitk audits run --json

# Read committed state rather than an arriving change. Exit 2 carries findings
aitk secrets scan --json
aitk deps audit --json
```

The two state-scoped verbs both exit 2 on findings and mean different things by
it. A credential in the shipped tree is a fact and fails `aitk audits run`, while
a published advisory is a judgment that reports and moves no verdict. Neither
reads a diff, so a consumer already running a review surface gets no overlap.

Both refuse rather than report clean when they have no corpus, and the refusal
reason is the field to branch on. A project publishing nothing refuses the secret
scan with `no-manifest`, and one whose dependencies are not installed refuses the
advisory check with `no-lockfile`. The aggregate reads those as an absent corpus
rather than a broken run, so neither pins its verdict at `incomplete`.

`aitk tooling sync` is the one verb above whose flag is mandatory headlessly. It
overwrites every golden config a stack ships, which reaches the CI workflow, the
git hooks, the end-to-end harness, and the shell scripts under `scripts/`, so a
headless run carrying neither `--check` nor `--write` reports what it would
replace and exits 1 rather than applying it. Run `--check` first to read the
list, then `--write` to apply it. `aitk tooling sync --help` names both, and the
full per-stack path list sits in the `toolkit-cli` skill.
