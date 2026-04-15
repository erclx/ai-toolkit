# Tasks archive

Completed tasks moved here from `TASKS.md`. Oldest entries at the top, newest at the bottom.

### Catalog emitters for other domains

Unlocks the detect-pick-execute skill pattern (proven by `gov-install`) for snippets, tooling, and standards. Each emitter is a thin `list.sh` mirroring `scripts/gov/list.sh` with the domain's own catalog files.

- [x] `aitk snippets list` emits available snippet categories and entries with `--json` support
- [x] `aitk tooling list` emits available stacks with extends chain and dep summary, with `--json` support
- [x] `aitk standards list` emits available standards with descriptions and `--json` support

> Test strategy: manual, run each with and without `--json`, parse JSON output via bun and confirm stacks and entries match source files.
