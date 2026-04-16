# Standards system

## Overview

Standards are markdown docs that define developer workflow conventions. They sync directly to target projects and are consumed by AI agents and developers alike. Standards cover workflow conventions, not code style. Code style belongs in governance rules.

## Structure

```plaintext
standards/
├── index.md            ← generated from installed files on install and sync
├── *.md                ← source standards
scripts/
└── manage-standards.sh ← entry point (aitk standards)
```

`index.md` is a generated file. `aitk standards install` and `aitk standards sync` rewrite it in the target based on which standards are present. Do not hand-edit it in a target project.

## Standards

| File           | Covers                                      |
| -------------- | ------------------------------------------- |
| `branch.md`    | Branch naming format and type conventions   |
| `changelog.md` | Changelog format and entry conventions      |
| `commit.md`    | Commit message format and type conventions  |
| `pr.md`        | Pull request title and body conventions     |
| `prose.md`     | Voice, structure, formatting, and language  |
| `readme.md`    | Readme structure and content conventions    |
| `skill.md`     | Claude skill structure and authoring rules  |
| `snippets.md`  | Snippet reference and authoring conventions |

## CLI

| Command                         | What it does                                          |
| ------------------------------- | ----------------------------------------------------- |
| `aitk standards install [path]` | Copy all standards into a target project (overwrites) |
| `aitk standards sync [path]`    | Update standards already present in target            |
| `aitk standards list [--json]`  | Emit catalog of standards with descriptions           |

`aitk standards` with no args shows a picker for `install`, `sync`, or `list`. The install command requires confirmation before writing files.

## Workflow

To set up a new project:

```bash
aitk standards install ../my-app
# copies all standards into ../my-app/standards/
```

To sync updates to an existing project:

```bash
aitk standards sync ../my-app
# diffs standards already present, proposes new ones too
```

## Adding a standard

Create a `.md` file in `standards/`. No build step needed. Run `aitk standards install` to push to a new project or `aitk standards sync` to update an existing one.

## Notes

- Standards are the same across every project, no stack variation, no extends chain.
- `aitk standards install` overwrites all standards intentionally.
- `aitk standards sync` only updates files already present, never adds new ones.
