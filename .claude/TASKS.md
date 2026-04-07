# Tasks

## TypeScript CLI migration

Migrate the `aitk` entry point from bash to TypeScript using `commander` + `@clack/prompts` + `execa`, with `bun` as the runtime (no build step).

### Decisions

- Bun as runtime: `#!/usr/bin/env bun` shebang, no tsc build step
- Keep all `manage-*.sh` files alongside until each domain is fully migrated
- Bash domain scripts (`scripts/gov/sync.sh`, `scripts/snippets/install.sh`, etc.) stay in bash permanently — they are file ops and git orchestration
- `scripts/lib/ui.sh` stays for any bash scripts that run standalone
- Stack: `commander` + `@clack/prompts` + `execa` (no Ink, no React)

### Phase 1 — TypeScript CLI shell

Replace `manage-aitk.sh` dispatcher with a TypeScript entry point. Every subcommand execs the existing bash script (functionally identical to today).

| File                          | Status | Notes                                                     |
| ----------------------------- | ------ | --------------------------------------------------------- |
| `src/cli.ts`                  | done   | Main entry, registers subcommands via commander           |
| `src/exec.ts`                 | done   | Shared helper: resolve PROJECT_ROOT, spawn bash via execa |
| `src/commands/sandbox.ts`     | done   | Wraps `scripts/manage-sandbox.sh`                         |
| `src/commands/sync.ts`        | done   | Wraps `scripts/manage-sync.sh`                            |
| `src/commands/gov.ts`         | done   | Wraps `scripts/manage-gov.sh`                             |
| `src/commands/standards.ts`   | done   | Wraps `scripts/manage-standards.sh`                       |
| `src/commands/snippets.ts`    | done   | Wraps `scripts/manage-snippets.sh`                        |
| `src/commands/prompts.ts`     | done   | Wraps `scripts/manage-prompts.sh`                         |
| `src/commands/tooling.ts`     | done   | Wraps `scripts/manage-tooling.sh`                         |
| `src/commands/claude.ts`      | done   | Wraps `scripts/manage-claude.sh`                          |
| `src/commands/wiki.ts`        | done   | Wraps `scripts/manage-wiki.sh`                            |
| `src/commands/antigravity.ts` | done   | Wraps `scripts/manage-antigravity.sh`                     |
| `package.json`                | done   | Changed `bin.aitk` to `./src/cli.ts`, added deps          |
| `tsconfig.json`               | done   | Minimal bun config with `bun-types`                       |

Key detail: set `PROJECT_ROOT` env var before spawning child bash processes.

### Phase 2 — Migrate sandbox interactive prompts to clack

Replace bash `select_option` in sandbox with native `@clack/prompts` calls. Scope TBD (at minimum: category/command picker).

| File                      | Status  | Notes                                                              |
| ------------------------- | ------- | ------------------------------------------------------------------ |
| `src/commands/sandbox.ts` | pending | Native clack prompts for category/command picker                   |
| `src/ui.ts`               | pending | Shared wrapper around `@clack/prompts` matching timeline aesthetic |
| `package.json`            | pending | Add `@clack/prompts`                                               |

### Phase 3 — Gradual domain migration (future)

Pull interactive logic into TypeScript per domain as each is touched. No fixed scope — opportunistic.

### Post-implementation checklist

Run after Phase 1 and Phase 2 are working.

| Task                                          | Status  | Notes                                                                 |
| --------------------------------------------- | ------- | --------------------------------------------------------------------- |
| Update `docs/scripts.md`                      | pending | Document TS entry point, `src/` structure, how dispatch works         |
| Update `docs/sandbox.md`                      | pending | Phase 2 changes how sandbox interactive prompts work                  |
| Update `.claude/skills/aitk-scripts/SKILL.md` | pending | Skill body must reflect `src/` directory and TS dispatch layer        |
| Update `CLAUDE.md` system overview            | pending | Add `src/` to key paths, update domain table for scripts row          |
| Update `.cspell/tech-stack.txt`               | pending | Add `clack`, `execa`, `commander`, `tsconfig`                         |
| Update `package.json` scripts                 | pending | Verify `check:shell` find path still works, add lint for TS if needed |
