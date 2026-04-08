# Tooling vite-react reference

> Extends: `base`. Apply base stack first.

## Overview

The vite-react stack covers Vite + React + TypeScript projects: web apps and Chrome extensions. It provides ESLint, Vitest, Playwright, Tailwind, and supporting scripts. No golden configs are shipped. The agent reads this reference and generates configs adapted to the specific project.

## Scaffold checklist

1. Scaffold with the appropriate tool (`bunx create-vite@latest`, `bunx create-crxjs@latest`, `bunx create-next-app@latest`, etc.)
2. Install base tooling: `aitk tooling sync base .`
3. Install vite-react deps: `aitk tooling sync vite-react .`
4. Create: `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`
5. Create: `src/test/setup.ts`, `e2e/screenshot.ts`, `tsconfig.e2e.json`
6. Update: `tsconfig.app.json` (add paths, types), `tsconfig.json` (add e2e reference)
7. Run `bun run lint:fix` to auto-fix scaffolded files
8. Run `bun run check` to verify

## Prettier (extend)

- Add `jsxSingleQuote: true`.
- Add `prettier-plugin-tailwindcss` to plugins array.

## Lint-Staged (extend)

- Add `**/*.{js,jsx,ts,tsx}` glob: `["eslint --fix --max-warnings 0", "prettier --write --ignore-path .gitignore --ignore-path .prettierignore", "cspell --no-must-find-files"]`.
- Extend prettier glob to include `css`: `**/*.{json,css,md,mdc}` with `["prettier --write --ignore-path .gitignore --ignore-path .prettierignore", "cspell --no-must-find-files"]`.
- Each file type runs cspell once via its own glob. No standalone cspell glob.

## ESLint

- Config: `eslint.config.js` (flat config, ESM).
- Imports: `defineConfig` and `globalIgnores` from `eslint/config` (not from a plugin).
- Structure: define named config objects as constants, compose them in `defineConfig` array.
- Order: ignores, base JS, typescript-eslint, feature conventions, react, testing, prettier (last).
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-config-prettier` (last to disable formatting conflicts).
- Unused variables: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: "^_"`.
- Import sorting: `simple-import-sort/imports` and `simple-import-sort/exports` as errors.
- File naming: `KEBAB_CASE` for `**/*.{ts,tsx}` via `check-file/filename-naming-convention` with `ignoreMiddleExtensions: true`.
- Folder naming: `KEBAB_CASE` for `src/**/!(__tests__)` via `check-file/folder-naming-convention`.
- React hooks: use `reactHooks.configs.recommended.rules`.
- React refresh: `only-export-components` as warning with `allowConstantExport: true`.
- Vitest: apply `vitest.configs.recommended.rules` and `vitest.environments.env.globals` to `**/*.test.{ts,tsx}` files only.
- Global ignores: `dist`, `dist-ssr`, `coverage`, `release`, `.claude`, `.gemini`, `.vscode`, `.husky`, `test-results`, `playwright-report`, `blob-report`, `playwright/.cache`.

## TypeScript

- Build: `tsc -b` before `vite build`.
- Type check: `tsc --noEmit` as standalone script.
- Do not template full tsconfigs. Use scaffold defaults.
- Root `tsconfig.json` must include `tsconfig.e2e.json` in references.
- `tsconfig.app.json` must include `vitest/globals` and `@testing-library/jest-dom` in `types`.
- `tsconfig.app.json` must include `paths: { "@/*": ["./src/*"] }` to match vite alias.
- E2E tsconfig: `tsconfig.e2e.json` extending `tsconfig.node.json` with `@playwright/test` types, including `e2e/` and `playwright.config.ts`.

## Vite

- Config: `vite.config.ts`.
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`.
- Path alias: `@` mapped to `./src`.
- Web apps: support `VITE_BASE_URL` env variable for base path.
- Chrome extensions: use `crx({ manifest })` and `zip()` plugins instead. Set `server.port: 5173`, `server.strictPort: true`, `server.hmr.clientPort: 5173`. Allow `chrome-extension://` CORS origin. No `loadEnv` or `VITE_BASE_URL`.

## Vitest

- Config: `vitest.config.ts`.
- Environment: `jsdom`.
- Globals: `true`.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`, runs `cleanup` after each test).
- Exclude: `node_modules`, `dist`, `e2e`, `.{idea,git,cache,output,temp}`.
- Coverage: `v8` provider, reporters `text`, `json`, `html`. Exclude `node_modules/`, `src/test/setup.ts`, `e2e/`.
- Web apps: merge config from `vite.config.ts` using `mergeConfig` and `defineConfig`.
- Chrome extensions: use standalone config (do not merge from `vite.config.ts` — plugins like crxjs break vitest). Declare `@vitejs/plugin-react` and `@tailwindcss/vite` directly. Add `**/release/**` to excludes and `manifest.config.ts`, `**/*.d.ts` to coverage excludes.

## Playwright

- Config: `playwright.config.ts`.
- Test directory: `e2e/`.
- Trace: `on-first-retry`.
- CI behavior: `forbidOnly`, 2 retries, 1 worker, `list` reporter.
- Local behavior: no retries, default workers, `html` reporter.
- Web apps: test all browsers (chromium, firefox, webkit). Use `webServer` pointing to `bun run dev` on port 5173, reuse existing server locally. Set `baseURL: http://localhost:5173`.
- Chrome extensions: chromium only (Firefox and WebKit cannot run extensions). No `baseURL` or `webServer` — tests load the built extension directly. Must use bundled `chromium` channel.

## E2E fixtures (Chrome extensions only)

- File: `e2e/fixtures.ts`. Extends Playwright base `test` with `context` and `extensionId` fixtures.
- `context`: launches persistent browser context with extension loaded from `dist/`.
- `extensionId`: extracted from service worker URL. Not hardcoded.
- `use` renamed to `apply` to avoid React hooks ESLint rule.
- `waitForEvent('serviceworker')` blocks until MV3 service worker registers.

## Screenshots

- File: `e2e/screenshot.ts`. Seeded once, user-owned.
- Split into `CONFIG` and `ENGINE` sections. Only the config section changes per project.
- `STATES` is an array of `{ name, setup? }`. Adding a new state is one object.
- `colorScheme` set via `emulateMedia`. No UI interaction needed.
- Output to `screenshots/` (gitignored).
- Node 22+ required for `--experimental-strip-types`. On older versions use `bunx tsx`.
- Review one route/surface and one color scheme per AI session, not everything at once.
- Web apps: define `ROUTES` with named app routes and viewport dimensions. Run via `bun run build && bun run preview & sleep 2 && node --experimental-strip-types e2e/screenshot.ts`. Preview server on port 4173.
- Chrome extensions: define `SURFACES` with extension page dimensions. Use `SEED` to inject data into `chrome.storage.local` via `addInitScript`. Empty state uses a separate context with no seed data. Run via `bun run build && node --experimental-strip-types e2e/screenshot.ts`.

## Chrome extension manifest

- File: `manifest.config.ts` using `defineManifest` from `@crxjs/vite-plugin`.
- Read `name` and `version` from `package.json`.
- Entry points: `src/popup/index.html`, `src/sidepanel/index.html`, `src/background/index.ts`, `src/content/main.tsx`.
- Permissions: `sidePanel`, `contentSettings`, `storage`.
- Icon: `public/logo.png` at size 48.

## Setup script

- File: `scripts/setup.sh`. Destructive: deletes `.git` and self-removes after running. Run once immediately after scaffolding.
- Prompt for project name, normalize to kebab-case.
- Derive title-cased display name for HTML titles.
- Update `package.json`: set `name`, reset `version` to `0.1.0`, inject `verify`, `clean`, `update` scripts, remove `setup`.
- Update `<title>` tags in HTML files.
- Wipe `.git`, re-init with `--initial-branch=main`, make scripts executable, commit everything as `chore(root): initialize <name>`.
- Rename project folder to match kebab-case name if needed.
- Offer to open in VS Code or Cursor and install dependencies if an editor is launched.

## Verify script (extend)

- Add steps before base checks: typecheck, lint.
- Add steps after base checks: unit tests, production build.
- Full order: typecheck, lint, format, spelling, unit tests, build.

## CI workflow

- File: `.github/workflows/verify.yml`.
- Trigger: pull requests to `main` + `workflow_dispatch`.
- All jobs: checkout, setup bun (latest), `bun install --frozen-lockfile`.
- `static-checks`: install shfmt and shellcheck, typecheck, lint, check:format, check:spell, check:shell.
- `unit-tests`: `bun run test:coverage`.
- `build-verify`: `bun run build`.
- Web apps: add `e2e-tests` job (depends on all above). Cache Playwright browsers, install chromium if cache miss, run `test:e2e --project=chromium`, upload report artifact on failure (7 day retention).
- Chrome extensions: no E2E job in CI (extensions cannot run Playwright against a dev server).

## VS Code (extend)

- Extensions: add `dbaeumer.vscode-eslint`, `bradlc.vscode-tailwindcss`, `ms-playwright.playwright`, `vitest.explorer`.
- Settings: add `editor.defaultFormatter: "esbenp.prettier-vscode"`, `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`, `files.associations: { "*.css": "tailwindcss" }`.

## Gitignore (extend)

- `# Build`: `dist/`
- `# Coverage`: `coverage/`
- `# Playwright`: `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`, `screenshots/`
- `# VS Code`: `.vscode/*`, `!.vscode/extensions.json`, `!.vscode/settings.json`
- Chrome extensions additionally: `# Chrome Extension`: `*.crx`, `*.pem`. `# Release`: `release/`.

## Package scripts (extend)

- `dev`: `vite`
- `build`: `tsc -b && vite build`
- `preview`: `vite preview`
- `lint`: `eslint . --max-warnings 0`
- `lint:fix`: `eslint . --fix --max-warnings 0`
- `typecheck`: `tsc --noEmit`
- `test`: `vitest`
- `test:run`: `vitest run --reporter=verbose`
- `test:ui`: `vitest --ui`
- `test:coverage`: `vitest run --coverage`
- `test:e2e`: `playwright test`
- `test:e2e:ui`: `playwright test --ui`
- `test:e2e:report`: `playwright show-report`
- `check:full`: `./scripts/verify.sh && bun run test:e2e`
- `setup`: `./scripts/setup.sh`
- `screenshot`: web apps use `bun run build && bun run preview & sleep 2 && node --experimental-strip-types e2e/screenshot.ts`. Chrome extensions use `bun run build && node --experimental-strip-types e2e/screenshot.ts`.
