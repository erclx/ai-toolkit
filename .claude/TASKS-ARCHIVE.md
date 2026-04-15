# Tasks archive

Completed tasks moved here from `TASKS.md`. Oldest entries at the top, newest at the bottom.

### Catalog emitters for other domains

Unlocks the detect-pick-execute skill pattern (proven by `gov-install`) for snippets, tooling, and standards. Each emitter is a thin `list.sh` mirroring `scripts/gov/list.sh` with the domain's own catalog files.

- [x] `aitk snippets list` emits available snippet categories and entries with `--json` support
- [x] `aitk tooling list` emits available stacks with extends chain and dep summary, with `--json` support
- [x] `aitk standards list` emits available standards with descriptions and `--json` support

> Test strategy: manual, run each with and without `--json`, parse JSON output via bun and confirm stacks and entries match source files.

### Non-interactive scenario routing across all sandbox scripts

Sandbox `infra/*` scripts already route via `SANDBOX_SCENARIO`, but `git/*`, `dev/*`, and `docs/*` relied on `select_option`'s first-option fallback when non-interactive. This blocked agents from triggering specific scenarios automatically (e.g. running `stacked` after a `git-split` skill change). Added a `select_or_route_scenario` helper to `lib/ui.sh` and switched multi-scenario scripts over, plus slug-renamed scenario names in `git/ship.sh`, `dev/review.sh`, and `docs/sync.sh` so agents can pass them without quoting, and added a hard-error default arm to every case to catch typos.

- [x] Every multi-scenario sandbox script routes to the named scenario when `SANDBOX_SCENARIO` is set
- [x] `aitk sandbox <category>:<command> <scenario>` provisions the right scenario without prompts
- [x] Single-scenario scripts unchanged

> Test strategy: manual, run each multi-scenario script with `aitk sandbox <cat>:<cmd> <scenario>` and verify the matching setup runs without TTY input.
