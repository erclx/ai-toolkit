# Tooling astro reference

> Extends: `base`. Apply base stack first.

## Overview

The astro stack covers Astro + TypeScript projects: content sites, marketing sites, blogs, and docs. Interactive islands use React only. Tailwind is v4 via the Vite plugin. Output is static. It provides ESLint, Vitest, Playwright, Tailwind, and supporting scripts. No golden configs are shipped. The agent reads this reference and generates configs adapted to the specific project.

## Scaffold checklist

1. Scaffold with `bunx create-astro@latest`. Choose `TypeScript: Strict`, skip git init, skip install.
2. Add integrations: `bunx astro add react`. Do not use `astro add tailwind` (that installs the v3 integration). Install Tailwind v4 manually via the dep list below.
3. Install base tooling: `aitk tooling sync base .`
4. Install astro deps: `aitk tooling sync astro .`
5. Create: `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`
6. Create: `src/test/setup.ts`, `e2e/screenshot.ts`, `tsconfig.e2e.json`
7. Run `bun run lint:fix` to auto-fix scaffolded files
8. Run `bun run check` to verify

## Prettier (extend)

- Add `prettier-plugin-astro` to plugins array (first).
- Add `prettier-plugin-tailwindcss` to plugins array (last, must be last per its docs).
- Add parser override for `.astro`: `{ files: "*.astro", options: { parser: "astro" } }`.

## Lint-Staged (extend)

- Add `**/*.astro` glob: `["eslint --fix --max-warnings 0", "prettier --write --ignore-path .gitignore --ignore-path .prettierignore", "cspell --no-must-find-files"]`.
- Add `**/*.{js,jsx,ts,tsx}` glob with the same chain.
- Extend prettier glob to include `css`: `**/*.{json,css,md,mdc}` with prettier + cspell.
- Each file type runs cspell once via its own glob. No standalone cspell glob.

## ESLint

- Config: `eslint.config.js` (flat config, ESM).
- Imports: `defineConfig` and `globalIgnores` from `eslint/config` (not from a plugin).
- Structure: define named config objects as constants, compose them in `defineConfig` array.
- Order: ignores, base JS, typescript-eslint, astro, feature conventions, react, testing, prettier (last).
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-astro` recommended, `eslint-config-prettier` (last to disable formatting conflicts).
- Astro files: `eslint-plugin-astro` provides `*.astro` parser via `astro-eslint-parser`. Apply astro-specific rules only to `**/*.astro`.
- Unused variables: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: "^_"`.
- Import sorting: `simple-import-sort/imports` and `simple-import-sort/exports` as errors.
- File naming: `KEBAB_CASE` for `**/*.{ts,tsx,astro}` via `check-file/filename-naming-convention` with `ignoreMiddleExtensions: true`. Exclude `src/pages/**` because Astro's file-based routing ties filenames to URL segments that may not be kebab-case.
- Folder naming: `KEBAB_CASE` for `src/**/!(__tests__|pages)` via `check-file/folder-naming-convention`. `src/pages/` is exempt for the same reason.
- React hooks: apply `reactHooks.configs.recommended.rules` to `**/*.{jsx,tsx}` only. `.astro` files are not React.
- React refresh: not applicable. Astro uses its own island hydration runtime, not Vite React Fast Refresh.
- Vitest: apply `vitest.configs.recommended.rules` and `vitest.environments.env.globals` to `**/*.test.{ts,tsx}` files only.
- Global ignores: `dist`, `.astro`, `coverage`, `.claude`, `.gemini`, `.vscode`, `.husky`, `test-results`, `playwright-report`, `blob-report`, `playwright/.cache`.

## TypeScript

- Type check: `astro check` as standalone script. Replaces `tsc --noEmit` because `tsc` cannot parse `.astro` files.
- Build: `astro check && astro build`.
- Do not template full tsconfigs. Use scaffold defaults (`extends: "astro/tsconfigs/strict"`).
- Root `tsconfig.json` must include `tsconfig.e2e.json` in references.
- Root `tsconfig.json` must include `vitest/globals` and `@testing-library/jest-dom` in `types`.
- Path alias: `paths: { "@/*": ["./src/*"] }` in root tsconfig, mirrored in `astro.config.mjs` via `vite.resolve.alias`.
- E2E tsconfig: `tsconfig.e2e.json` extending `astro/tsconfigs/base` with `@playwright/test` types, including `e2e/` and `playwright.config.ts`.

## Astro config

- Config: `astro.config.mjs`.
- Integrations: `@astrojs/react` for interactive islands.
- Tailwind v4: add `@tailwindcss/vite` to `vite.plugins`. Do not use `@astrojs/tailwind` (that is the v3 integration).
- Path alias: `vite.resolve.alias` with `@` mapped to `./src`.
- Output: `static` (default). Adapters and SSR are out of scope for this stack.
- Site URL: support `ASTRO_SITE` env variable for `site` field. Used by sitemap and canonical URLs.
- Dev server: port 4321 (Astro default).

## Vitest

- Config: `vitest.config.ts`.
- Compose via `getViteConfig` from `astro/config`:
  ```ts
  import { getViteConfig } from "astro/config"
  export default getViteConfig({ test: { ... } })
  ```
- Environment: `jsdom`.
- Globals: `true`.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`, runs `cleanup` after each test).
- Exclude: `node_modules`, `dist`, `.astro`, `e2e`, `.{idea,git,cache,output,temp}`.
- Coverage: `v8` provider, reporters `text`, `json`, `html`. Exclude `node_modules/`, `src/test/setup.ts`, `e2e/`, `**/*.astro`.
- Scope: unit-test React island components (`.tsx`) only. Do not test `.astro` files. Page-level behavior is verified by Playwright against rendered output.

## Playwright

- Config: `playwright.config.ts`.
- Test directory: `e2e/`.
- Trace: `on-first-retry`.
- CI behavior: `forbidOnly`, 2 retries, 1 worker, `list` reporter.
- Local behavior: no retries, default workers, `html` reporter.
- Browsers: chromium, firefox, webkit.
- `webServer` runs `bun run build && bun run preview` on port 4321, reuse existing server locally. Astro's dev/prod gap is wide enough (MDX processing, island hydration, asset optimization) that dev-server E2E gives weak signal. Test the built `dist/` output.
- `baseURL: http://localhost:4321`.

## Screenshots

- File: `e2e/screenshot.ts`. Seeded once, user-owned.
- Split into `CONFIG` and `ENGINE` sections. Only the config section changes per project.
- `STATES` is an array of `{ name, setup? }`. Adding a new state is one object.
- `colorScheme` set via `emulateMedia`. No UI interaction needed.
- Output to `screenshots/` (gitignored).
- Node 22+ required for `--experimental-strip-types`. On older versions use `bunx tsx`.
- Review one route and one color scheme per AI session, not everything at once.
- Define `ROUTES` with named page routes and viewport dimensions. Astro routes map to files under `src/pages/`.
- Run via `bun run build && bun run preview & sleep 2 && node --experimental-strip-types e2e/screenshot.ts`. Preview server on port 4321.

## Setup script

- File: `scripts/setup.sh`. Destructive: deletes `.git` and self-removes after running. Run once immediately after scaffolding.
- Prompt for project name, normalize to kebab-case.
- Derive title-cased display name for `site.title` and `<title>` tags.
- Update `package.json`: set `name`, reset `version` to `0.1.0`, inject `verify`, `clean`, `update` scripts, remove `setup`.
- Update `astro.config.mjs`: set `site` if provided.
- Update `<title>` and `<meta name="description">` in the default layout.
- Wipe `.git`, re-init with `--initial-branch=main`, make scripts executable, commit everything as `chore(root): initialize <name>`.
- Rename project folder to match kebab-case name if needed.
- Offer to open in VS Code or Cursor and install dependencies if an editor is launched.

## Verify script (extend)

- Add steps before base checks: astro check, lint.
- Add steps after base checks: unit tests, production build.
- Full order: astro check, lint, format, spelling, unit tests, build.

## CI workflow

- File: `.github/workflows/verify.yml`.
- Trigger: pull requests to `main` + `workflow_dispatch`.
- All jobs: checkout, setup bun (latest), `bun install --frozen-lockfile`.
- `static-checks`: install shfmt and shellcheck, `astro check`, lint, check:format, check:spell, check:shell.
- `unit-tests`: `bun run test:coverage`.
- `build-verify`: `bun run build`.
- `e2e-tests` (depends on all above): cache Playwright browsers, install browsers if cache miss, run `test:e2e`, upload report artifact on failure (7 day retention).

## VS Code (extend)

- Extensions: add `astro-build.astro-vscode`, `dbaeumer.vscode-eslint`, `bradlc.vscode-tailwindcss`, `ms-playwright.playwright`, `vitest.explorer`.
- Settings: add `editor.defaultFormatter: "esbenp.prettier-vscode"`, `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`, `files.associations: { "*.css": "tailwindcss" }`.
- `[astro]` override: `editor.defaultFormatter: "astro-build.astro-vscode"` so the Astro extension owns `.astro` formatting via `prettier-plugin-astro`.

## Gitignore (extend)

- `# Build`: `dist/`
- `# Astro`: `.astro/`
- `# Coverage`: `coverage/`
- `# Playwright`: `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`, `screenshots/`
- `# VS Code`: `.vscode/*`, `!.vscode/extensions.json`, `!.vscode/settings.json`

## Package scripts (extend)

- `dev`: `astro dev`
- `build`: `astro check && astro build`
- `preview`: `astro preview`
- `astro`: `astro` (exposes the CLI for `astro add`, `astro sync`, etc.)
- `lint`: `eslint . --max-warnings 0`
- `lint:fix`: `eslint . --fix --max-warnings 0`
- `typecheck`: `astro check`
- `test`: `vitest`
- `test:run`: `vitest run --reporter=verbose`
- `test:ui`: `vitest --ui`
- `test:coverage`: `vitest run --coverage`
- `test:e2e`: `playwright test`
- `test:e2e:ui`: `playwright test --ui`
- `test:e2e:report`: `playwright show-report`
- `check:full`: `./scripts/verify.sh && bun run test:e2e`
- `setup`: `./scripts/setup.sh`
- `screenshot`: `bun run build && bun run preview & sleep 2 && node --experimental-strip-types e2e/screenshot.ts`
