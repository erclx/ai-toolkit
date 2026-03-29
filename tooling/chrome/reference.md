# Tooling Chrome reference

> Extends: `vite-react`. Apply vite-react stack first.

## Overview

The chrome stack layers a Chrome Extension setup using CRXJS and Vite on top of vite-react. Use for browser extensions with popup, sidepanel, background, and content script entry points.

## Vite (Override)

- Replace vite-react `vite.config.ts` entirely. Do not merge.
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`, `crx({ manifest })`, `zip({ outDir: 'release', outFileName: 'crx-<n>-<version>.zip' })`.
- Path alias: `@` → `./src` via `path`.
- Server port: `5173`, `strictPort: true` (ensures HMR always connects on the same port).
- Server HMR: `clientPort: 5173` (required for extension content scripts to connect back correctly).
- Server cors: allow `chrome-extension://` origin.
- No `loadEnv` or `VITE_BASE_URL` (not applicable for extensions).
- Manifest imported from `manifest.config.js` (note `.js` extension, required by crxjs at runtime).
- `name` and `version` imported directly from `package.json` for zip filename.

## Vitest (Override)

- Standalone config: does not merge from `vite.config.ts`. Crxjs plugin breaks vitest if included.
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite` declared directly.
- Include: `src/**/*.test.{ts,tsx}` explicitly.
- Exclude: add `**/release/**` alongside standard excludes.
- Coverage excludes: add `manifest.config.ts` and `**/*.d.ts`.

## Playwright (Override)

- Config: `playwright.config.ts`.
- Test directory: `e2e/`.
- Projects: `chromium` only. Firefox and webkit cannot run Chrome extensions.
- Reporter: always `html`.
- No `baseURL` or `webServer`. Tests run against the built extension, not a dev server.
- Must use bundled `chromium` channel. Google removed sideload flags from Chrome and Edge.
- `trace: 'on-first-retry'`.

## E2E fixtures

- File: `e2e/fixtures.ts`. Golden config, extends Playwright base `test` with two fixtures.
- `context`: launches a persistent browser context with the extension loaded from `dist/`.
- `extensionId`: extracted from the service worker URL. Not hardcoded, Chrome assigns a different ID per context.
- `use` renamed to `apply` to avoid the React hooks ESLint rule treating it as a hook.
- `{}` in the context fixture is required by Playwright's API. The `eslint-disable` comment suppresses the empty destructure warning.
- `waitForEvent('serviceworker')` blocks until the MV3 service worker registers before any test runs.

## Screenshots

- File: `e2e/screenshot.ts`. Seeded once, user-owned. Edit the config section to match the extension.
- Split into `CONFIG` and `ENGINE` sections. Only the config section changes per project.
- `SURFACES` defines each extension page with its real-world dimensions.
- `SEED` injects data into `chrome.storage.local` via `addInitScript` before the page loads. Set to `null` if no seed data needed.
- `STATES` is an array of `{ name, setup? }`. Adding a new state is one object.
- Empty state uses a separate context with no seed data so storage is genuinely clean.
- `emulateMedia({ colorScheme })` toggles light/dark without UI interaction.
- Run `bun run screenshot`. Builds first, then captures. Outputs to `screenshots/` (gitignored via vite-react).
- Node 22+ required for `--experimental-strip-types`. On older versions use `bunx tsx e2e/screenshot.ts`.
- Review one surface and one color scheme per AI session (4 images), not all 12 at once.

## Manifest

- File: `manifest.config.ts` using `defineManifest` from `@crxjs/vite-plugin`.
- Reads `name` and `version` from `package.json` via import.
- Entry points: `src/popup/index.html`, `src/sidepanel/index.html`, `src/background/index.ts`, `src/content/main.tsx`.
- Permissions: `sidePanel`, `contentSettings`, `storage`.
- Icon: `public/logo.png` at size 48.

## Dev Dependencies (Extend)

- `@crxjs/vite-plugin`, `vite-plugin-zip-pack`, `@types/chrome`.

## Setup Script

- File: `scripts/setup.sh`. Destructive: deletes `.git` and self-removes after running. Run once immediately after scaffolding.
- Prompts for extension name, normalizes to kebab-case.
- Derives title-cased display name for HTML titles.
- Updates `package.json`: sets `name`, `description`, `author`, resets `version` to `0.1.0`, injects `verify`, `clean`, `update` scripts, removes `setup`.
- Updates `<title>` in `src/popup/index.html` and `src/sidepanel/index.html` only if they exist.
- Wipes `.git`, re-inits with `--initial-branch=main`, makes scripts executable, commits everything as `chore(root): initialize <n>`.
- Renames project folder to match kebab-case name if needed.
- Offers to open in VS Code or Cursor and installs dependencies if an editor is launched.

## CI Workflow

- File: `.github/workflows/verify.yml`.
- Trigger: pull requests to `main` + `workflow_dispatch`.
- Three jobs only: `static-checks`, `unit-tests`, `build-verify`. No E2E (extensions cannot run Playwright against a dev server in CI).
- All jobs: checkout → setup bun (latest) → `bun install --frozen-lockfile`.
- `static-checks`: install shfmt and shellcheck, typecheck, lint, check:format, check:spell, check:shell.
- `unit-tests`: `bun run test:coverage`.
- `build-verify`: `bun run build`.

## Gitignore (Extend)

- `# Chrome Extension`: `*.crx`, `*.pem`
- `# Release`: `release/`

## Package Scripts (Extend)

- `setup`: `./scripts/setup.sh`
- `screenshot`: `bun run build && node --experimental-strip-types e2e/screenshot.ts`
