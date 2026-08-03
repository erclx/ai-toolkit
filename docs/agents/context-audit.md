---
title: Context audit
description: Running the audit, its flags and folder scope, the exit codes, and the citation gate that is the only failing one
---

# Context audit

`aitk context audit [path]` reports the structural state of the folders following the index-plus-entry contract, meaning a generated `index.md` beside entries carrying frontmatter. It reads and reports. Fixing what it finds is separate work. What each finding means is in `context-audit-checks.md`.

```bash
aitk context audit
aitk context audit --json
aitk context audit --citations-only
aitk context audit --folder context,diagrams
aitk context audit --folder docs
```

| Option             | Behavior                                                             |
| ------------------ | -------------------------------------------------------------------- |
| `--json`           | Add a machine-readable record on stdout, keeping the frame           |
| `--folder <list>`  | Comma-separated folder names (default: the three below)              |
| `--citations-only` | Run the gating citation check alone, printing nothing when it passes |

## Folder scope

Scope defaults to `context`, `diagrams`, and `wireframes`, and a folder the project does not carry is skipped rather than reported. A domain that outgrew one file and split into `<domain>/` is audited as its own folder, so a split entry measures at the same grain as a flat one.

A name passed to `--folder` resolves under `.claude/` first and at the project root second, which is what puts `docs/` and any later corpus in reach of the same engine. The root base is reached only by a name the caller passes, so the default list still resolves under `.claude/` alone and a project holding a root `wireframes/` is not audited against a standard it never adopted. The scope line prints the resolved path, so a project carrying both spellings reads which one was taken. The JSON record carries the base per folder as `folders[].base`.

A run where no requested name resolves refuses, whichever list it read. Naming the absent ones narrows to `--folder`, since a project carrying one of the three default folders is the ordinary case and a name it never asked for is not a typo. The JSON record carries those names as `unresolvedFolders`.

## Exit codes

Exit codes are `0` for a clean run, `1` for a refusal, and `2` for an unresolved citation. Only the citation check sets a failing code. Required-section, length, depth, bullet weight, table, provenance, and index findings print and return `0`, because each is a judgment and failing a push on one would make the check something to route around.

## The citation gate

The citation check resolves every path into an audited folder that appears anywhere in the repository, and it is the half wired into `bun run check`. A stale reference has a silent failure mode: the session opens nothing and carries on.

Three exclusions keep it from firing on prose about paths. Fenced blocks are skipped in markdown, which covers a standard displaying a path as an example. Fixture and harness trees are skipped by location, covering sandbox scenarios that describe their own scratch tree, the eval harness naming its target project, and `*.test.ts`. A path into a folder the project does not carry is skipped, so a skill directing a reader to `.claude/wireframes/index.md` stays valid in a project that has wireframes and silent in one that does not.

What remains is a sentence naming a hypothetical entry to show the shape of a name, which no syntax separates from a real reference. Append `<!-- audit-ignore-citations -->` to that source line. The marker suppresses citation checking for its own line only.

The pattern spells the `.claude/` prefix, so a folder resolved at the project root is measured by every other check and contributes nothing here. Widening it to a bare `docs/x.md` would match prose that references nothing, which is a separate decision from where entries come from. A run whose folders all resolved at the root says the check is out of scope rather than reporting that zero paths resolved, and the same run under `--citations-only` refuses, because a gate exiting clean on a scope it could not build is the failure the gate exists to catch.
