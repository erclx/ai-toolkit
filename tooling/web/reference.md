# Tooling web reference

> Extends: `base`. Apply base stack first.

## Overview

The web layer covers web-universal tooling shared across Vite + React, Astro, and any future web stack. It ships golden configs for ESLint, Vitest, Playwright, Tailwind v4, screenshots, VS Code integration, and CI. Framework-specific wiring (Vite plugins, Astro islands, Next.js config) lives in per-stack adapter folders that extend this layer.

## What ships as golden configs

Golden config files live in `tooling/web/configs/` and are copied into the target on `aitk tooling sync web .`. They are the source of truth. The reference narrates why they look the way they do, not what they contain.

- `eslint.config.js`: flat config with `@eslint/js`, `typescript-eslint`, React hooks, import sort, check-file, vitest rules scoped to test files, `eslint-config-prettier` last.
- `src/test/setup.ts`: `@testing-library/jest-dom` import, `cleanup` after each test.
- `e2e/screenshot.ts`: `CONFIG` and `ENGINE` split template. Per-project ROUTES or SURFACES edited in the CONFIG section only.
- `.vscode/extensions.json` and `.vscode/settings.json`: editor wiring for ESLint, Tailwind, Playwright, Vitest.
- `.github/workflows/verify.yml`: `static-checks`, `unit-tests`, `build-verify`, and `e2e-tests` jobs.
- `scripts/verify.sh`: extends base verify with typecheck, lint, unit tests, and build in the full order.

## What stays in per-stack adapters

Framework glue lives in `tooling/vite-react/configs/` or `tooling/astro/configs/` because the merge helpers and config shapes differ:

- `vite.config.ts` or `astro.config.mjs`: the framework's config.
- `vitest.config.ts`: uses `mergeConfig` in Vite stacks, `getViteConfig` from `astro/config` in Astro.
- `playwright.config.ts`: `webServer` command differs per stack.
- `tsconfig.json`: `extends` target differs. Astro uses `astro/tsconfigs/strict`. Vite projects use scaffold defaults.

## File layout

- `src/` for app code, `e2e/` for Playwright, `scripts/` for shell, `src/test/setup.ts` for Vitest globals.
- Path alias `@` maps to `./src` in both tsconfig and the framework's build config.
- Tsconfig is unified at root with `noEmit: true` in Vite stacks. Astro uses the scaffold default from `@astrojs/check`.

## Anti-patterns

Sticky negative knowledge. Do not relearn.

- Do NOT use `tsc -b` in a Vite project. Composite mode emits `.js` next to `.ts` and ESLint lints the emitted files. Use `tsc --noEmit`.
- Do NOT accept `eslint@^10` alongside `typescript-eslint@^8`. Chain breaks with `TypeError: Class extends value undefined` from `LegacyESLint`. Pin `eslint@^9` until `typescript-eslint@^9` with ESLint 10 support ships.
- Do NOT rely on bare-folder exclude globs like `exclude: ["e2e"]`. Use `"e2e/**/*"`.
- Do NOT ship Vitest with no-tests-fail. Fresh scaffolds have zero tests. Use `passWithNoTests: true` or equivalent until the project has at least one test.
- Do NOT put Playwright `trace` at the top level of `defineConfig`. It lives under `use`.
- Do NOT skip `skipLibCheck: true` in Vite + React tsconfig. `@testing-library/jest-dom` and Vite's `module-runner` produce type conflicts otherwise.
- Do NOT run `bunx shadcn@latest init` over a pre-existing `src/styles/global.css`. Shadcn silently overwrites it. Back up first or run shadcn init before writing custom global styles. Use flags `-t <template> -b <base> -p <primary> -y` to avoid interactive prompts.

## Tool pairing

- Unit tests: Vitest with jsdom, globals on, setup file at `src/test/setup.ts`, `@testing-library/react`, `@testing-library/user-event`.
- E2E: Playwright in `e2e/`. Chromium-only for Chrome extensions, all browsers for web apps.
- Tailwind: v4 via `@tailwindcss/vite`. Never the v3 integration.
- Prettier: `prettier-plugin-tailwindcss` last in plugins array. Astro also adds `prettier-plugin-astro` first.

## Prettier (extend)

- Base ships `.prettierrc` with `semi: false`, `singleQuote: true`. Web layer adds `jsxSingleQuote: true` and `prettier-plugin-tailwindcss` via the manifest.
- Per-stack overrides go in the stack's configs (Astro adds `prettier-plugin-astro` and the `.astro` parser override).

## Lint-Staged (extend)

- Add `**/*.{js,jsx,ts,tsx}` glob running `eslint --fix --max-warnings 0`, `prettier --write`, `cspell --no-must-find-files`.
- Extend the prettier glob to include `css`: `**/*.{json,css,md,mdc}`.
- Each file type runs cspell once via its own glob. No standalone cspell glob.

## CI docs (extend)

Extend `docs/ci.md` so the `## Checks` table reflects the web jobs.

Append rows:

| Typecheck | `bun run typecheck` | framework-specific typecheck passes |
| Lint | `bun run lint` | ESLint passes with zero warnings |
| Tests | `bun run test:coverage` | Vitest passes with coverage thresholds |
| Build | `bun run build` | Production build succeeds |
| E2E | `bun run test:e2e` | Playwright passes against the built preview |

Under `## Running CI locally`, document that `bun run check:full` runs verify plus `test:e2e`.

## Development docs (extend)

Extend `docs/development.md` so the `## Scripts` table lists every web script. Stack adapters add their `dev`, `build`, `preview`, `typecheck` rows.

Append rows:

| `bun run lint` | Run ESLint with zero warnings allowed. |
| `bun run lint:fix` | Auto-fix ESLint issues. |
| `bun run test` | Run Vitest in watch mode. |
| `bun run test:run` | Run Vitest once with verbose reporter. |
| `bun run test:coverage` | Run Vitest with coverage. |
| `bun run test:e2e` | Run Playwright E2E tests. |
| `bun run screenshot` | Build, preview, then capture screenshots. |

## Verify script

The web layer's `scripts/verify.sh` replaces the base version. Order: typecheck, lint, format, spelling, shell, unit tests, build. Stack adapters may override if their typecheck or build differs.
