# Tasks

Track what is being built and why, at the level of features and outcomes. No code-level steps or technical decisions. Those live in `ARCHITECTURE.md`. Update this doc whenever a task is started, completed, or scope changes.

When a task needs execution detail beyond this board, create a plan in `.claude/plans/` and add a `Plan:` line under the title pointing to it. On ship, delete the plan file.

What belongs:

- Task entries describing observable behavior: short bullet per item, one outcome per line
- A test strategy line per task block: the mechanism and what is being verified, not specific file or method names
- Inline notes on blockers or dependencies, attached to the relevant Up next entry

What does not belong:

- Class names, file paths, function names, or prop names in any entry or section title
- "In progress" or "Blocked" sections. Note these inline on the Up next entry instead.
- Code-level steps or implementation details (behavioral specifics are fine)

Title form by task type:

- Feature: outcome describing what the user can now do
- Fix: problem statement describing what is wrong
- Chore: imperative describing what is being done

One section only: Up next. Completed blocks stay in Up next until archived manually. Do not move them automatically. When Up next has no real tasks, keep the `### Nothing queued` placeholder. Remove it when adding the first real task.

Task block format. Include the `Plan:` line only when a `.claude/plans/` file exists for the task:

```markdown
### Title

Plan: .claude/plans/feature-<slug>.md

- [x] Outcome: what done looks like
- [x] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Up next

### Restructure tooling with a shared web layer and golden configs

Plan: .claude/plans/feature-tooling-golden-configs.md

Current per-stack references duplicate 80% of content and cannot be tested without invoking Claude against a sandbox. Introduce a `tooling/web/` layer carrying golden configs for web-universal tooling (ESLint, Vitest, Playwright, Tailwind, CI, screenshots). Per-stack folders shrink to framework adapters. Testability comes from a local verify script that scaffolds a fixture and asserts `bun run check` passes.

- [x] Outcome: `tooling/web/` exists with golden configs and a thin anti-patterns reference.
- [x] Outcome: `tooling/vite-react/` and `tooling/astro/` extend `web` and carry only framework-specific deltas.
- [x] Outcome: `scripts/tooling/sync.sh` preserves version constraints in manifest package strings.
- [x] Outcome: Sandbox vite-react and astro fixtures use `bun create vite@latest` and `bun create astro@latest` instead of hand-rolled files.
- [x] Outcome: Headless sandbox validation of `vite-react` and `astro` scaffolds through `bun run check`. Both green after manual `bun add -d eslint@^9` (sync does not override create-vite's eslint v10) and an `App.tsx` → `app.tsx` rename (KEBAB_CASE rule).
- [x] Outcome: `tooling/compat.md` removed, with its anti-patterns absorbed into the web reference.
- [x] Outcome: `docs/tooling.md` updated to describe the `base` → `web` → framework layer chain.

> Test strategy: manual, run the verify script against `vite-react` and `astro` and confirm both report green against current tool majors.
