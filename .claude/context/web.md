---
title: Web
description: The canon.erclx.dev landing page, its Astro build, and the CI and layout gaps that follow from that
---

# Web

## Overview

Owns `web/`, the Astro app behind the `canon.erclx.dev` landing page: one route, seven page sections. This is the toolkit's own public site rather than code shipped to a target project, so the application-code non-goal in `.claude/REQUIREMENTS.md` does not reach it. See `.claude/wireframes/landing-page.md` for layout intent and `.claude/context/tooling.md` for the astro-stack mechanics this domain inherits.

## Layout

- `web/src/pages/` owns the one route, assembling the section components
- `web/src/components/` owns the seven page sections
- `web/src/content/` owns page copy, each string tied to a `README.md` citation
- `web/src/lib/` owns the build-time catalog-counts reader
- `web/src/layouts/` owns the shared page shell
- `web/src/styles/` owns global CSS and the generated design tokens
- `web/e2e/` owns the Playwright suite
- `web/public/assets/` owns images symlinked from the repository's own `assets/`

## Decisions

- `counts.ts` splits its two child-process calls by what a non-zero exit means. `execSync` resolves the repository root through `git rev-parse --show-toplevel`, where a failure should throw. `readCatalogCounts` calls `spawnSync` for `canon gov counts --json` instead, since the verb can exit 2 for drift elsewhere in the tree that this page's build did not cause, so throwing on any non-zero exit would fail the build on a problem this page cannot see. `spawnSync` lets the reader check `stdout` and fail only when it is genuinely empty, so the page never ships a count nothing measured.
- Every string in `copy.ts` carries an inline citation to the `README.md` line or CLI verb it derives from. Copy written fresh and fact-checked afterward produced four false claims in ten minutes, and deriving from an already-sourced line is what the citations enforce.
- `global.css`'s defaults sit inside `@layer base`, not unlayered. Tailwind v4 generates its utilities inside `@layer utilities`, where an unlayered rule always wins regardless of specificity. An unlayered default once beat the CTA buttons' `text-(--color-*)` utility outright and rendered both with invisible label text, caught by screenshot review before merge.
- No `web/package.json` exists, since the repository declares no Bun workspaces. `bun run` invoked from elsewhere walks up to the repository root to run `web:build` and `web:preview`, pulling Playwright's cwd-relative output defaults with it, so `web/playwright.config.ts` anchors `outputDir` and its report folder to its own directory instead (`fileURLToPath(new URL('.', import.meta.url))`).
- Every `web:*` script in `package.json` runs `cd web` before invoking astro, rather than passing `astro --root web`. The mechanism, the golden astro config's `@` alias resolving against the invoking process's cwd, is recorded in `.claude/context/tooling.md`'s Gotchas. This is that domain's instance of the choice.
- `web/public/assets/*.png` and the favicon are symlinks into the repository's own `assets/`, not copies, for one image source. The Windows-checkout cost this carries, materializing each as a plain-text path with no build error, is recorded in `.claude/context/tooling.md`'s Gotchas.

## Gotchas

- `web/` has no typecheck in the automated gate, in three layers. `src/gate/stages.ts`'s `types` stage scopes to `/^src\/|^tsconfig\.json$|^package\.json$/`, so a web-only diff never matches it and the stage reports Skipped, and the root `tsconfig.json` sets `include` to `["src"]` alone, so `check:types` would not read `web/` even if the stage ran. `web/tsconfig.json` extends `astro/tsconfigs/strict`, but only the manual `bun run web:build`, through `astro check`, ever type-checks against it.
