# Tooling astro reference

> Extends: `web`. Apply web stack first.

## Overview

The astro stack covers Astro + TypeScript projects: content sites, marketing sites, blogs, and docs. Interactive islands use React only. Output is static. It ships golden configs for `astro.config.mjs`, `vitest.config.ts` (using `getViteConfig` from `astro/config`), `playwright.config.ts` (preview-server backed), a `tsconfig.json` that extends `astro/tsconfigs/strict`, and an `eslint.config.js` that overrides the web layer's config to include `eslint-plugin-astro` and exclude React-refresh rules.

## Scaffold checklist

1. Scaffold with `bunx create-astro@latest`. Choose `TypeScript: Strict`. Skip git init and install.
2. Add React integration: `bunx astro add react`. Do not use `astro add tailwind`. That command installs the v3 integration. Tailwind v4 arrives via the web manifest.
3. Install web tooling: `aitk tooling sync web .`
4. Install astro adapter: `aitk tooling sync astro .`
5. Extend `docs/ci.md` and `docs/development.md` per the web reference's extend sections plus the astro rows below.
6. Run `bun run lint:fix` then `bun run check`.

## What ships as golden configs

- `astro.config.mjs`: `@astrojs/react` integration, `@tailwindcss/vite` in `vite.plugins`, `@/` path alias via `vite.resolve.alias`, `ASTRO_SITE` env for the `site` field.
- `vitest.config.ts`: uses `getViteConfig` from `astro/config` (not `mergeConfig`). jsdom, globals, setup file, `passWithNoTests: true`, v8 coverage, `**/*.astro` in coverage excludes.
- `playwright.config.ts`: all browsers, `webServer` runs `bun run build && bun run preview` on port 4321. Astro's dev/prod gap is wide (MDX, island hydration, asset optimization), so E2E always tests the built `dist/`.
- `tsconfig.json`: extends `astro/tsconfigs/strict`, adds `skipLibCheck`, `vitest/globals` and `@testing-library/jest-dom` in types, `@/` paths.
- `eslint.config.js`: overrides the web layer. Adds `eslint-plugin-astro` (`.astro` parser via `astro-eslint-parser`). React-hooks scoped to `.jsx`/`.tsx` only (`.astro` is not React). `src/pages/**` exempt from filename and folder naming conventions because Astro's file-based routing ties names to URL segments.

## Typecheck

`astro check` replaces `tsc --noEmit` because `tsc` cannot parse `.astro` files. `build` runs `astro check && astro build`.

## Vitest scope

Unit-test React island components (`.tsx`) only. Do not test `.astro` files. Page-level behavior is verified by Playwright against rendered output.

## Setup script

- File: `scripts/setup.sh`. Destructive: deletes `.git` and self-removes after running. Run once immediately after scaffolding.
- Prompt for project name, normalize to kebab-case, derive title-cased display name.
- Update `package.json` name and version, inject verify/clean/update scripts, remove setup.
- Update `astro.config.mjs`: set `site` if provided.
- Update `<title>` and `<meta name="description">` in the default layout.

## Prettier (extend)

Add `prettier-plugin-astro` first in plugins, then `prettier-plugin-tailwindcss` last (per its docs). Add a parser override for `.astro` files.

## Development docs (extend)

Append to the `## Scripts` table:

| `bun run dev` | Start the Astro dev server on port 4321. |
| `bun run build` | Run `astro check` then build the static output. |
| `bun run preview` | Serve the built site locally. |
| `bun run astro` | Expose the Astro CLI. |
| `bun run typecheck` | Run `astro check`. |

## CI docs (extend)

In `docs/ci.md`, the Typecheck row's assertion reads: `` `astro check` passes ``. The Build row's assertion reads: `` `astro build` succeeds ``.
