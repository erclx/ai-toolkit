# TOOLING CHROME REFERENCE

> Extends: `vite-react`. Apply vite-react stack first.

## Overview

The chrome stack layers a Chrome Extension setup using CRXJS and Vite on top of vite-react. Use for browser extensions with popup, sidepanel, background, and content script entry points.

## Vite (Override)

- Replace vite-react `vite.config.ts` entirely — do not merge.
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`, `crx({ manifest })`, `zip({ outDir: 'release', outFileName: 'crx-<name>-<version>.zip' })`.
- Path alias: `@` → `./src` via `node:path`.
- Server cors: allow `chrome-extension://` origin.
- No `loadEnv` or `VITE_BASE_URL` — not applicable for extensions.
- Manifest imported from `manifest.config.js` (note `.js` extension — required by crxjs at runtime).
- `name` and `version` imported directly from `package.json` for zip filename.

## Vitest (Override)

- Standalone config — does not merge from `vite.config.ts`. Crxjs plugin breaks vitest if included.
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite` declared directly.
- Include: `src/**/*.test.{ts,tsx}` explicitly.
- Exclude: add `**/release/**` alongside standard excludes.
- Coverage excludes: add `manifest.config.ts` and `**/*.d.ts`.

## Manifest

- File: `manifest.config.ts` using `defineManifest` from `@crxjs/vite-plugin`.
- Reads `name` and `version` from `package.json` via import.
- Entry points: `src/popup/index.html`, `src/sidepanel/index.html`, `src/background/index.ts`, `src/content/main.tsx`.
- Permissions: `sidePanel`, `contentSettings`, `storage`.
- Icon: `public/logo.png` at size 48.

## Dev Dependencies (Extend)

- `@crxjs/vite-plugin`, `vite-plugin-zip-pack`.

## Setup Script

- File: `scripts/setup.sh`. Destructive — deletes `.git` and self-removes after running. Run once immediately after scaffolding.
- Prompts for extension name, normalizes to kebab-case.
- Derives title-cased display name for HTML titles.
- Updates `package.json`: sets `name`, `description`, `author`, resets `version` to `0.1.0`, injects `verify`, `clean`, `update` scripts, removes `setup`.
- Updates `<title>` in `src/popup/index.html` and `src/sidepanel/index.html`.
- Wipes `.git`, re-inits with `--initial-branch=main`, makes scripts executable, commits everything as `chore(root): initialize <name>`.
- Renames project folder to match kebab-case name if needed.
- Offers to open in VS Code or Cursor and installs dependencies if an editor is launched.

## Gitignore (Extend)

- `# Chrome Extension` — `*.crx`, `*.pem`
- `# Release` — `release/`

## Package Scripts (Extend)

- `build` — `tsc -b && vite build`
- `setup` — `./scripts/setup.sh`
