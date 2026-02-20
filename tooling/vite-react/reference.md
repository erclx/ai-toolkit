# TOOLING VITE REACT REFERENCE

> Extends: `base`. Apply base stack first.

## Prettier (Extend)

- Add `jsxSingleQuote: true`.
- Add `prettier-plugin-tailwindcss` to plugins array.

## Dev Dependencies (Extend)

- ESLint: `eslint`, `eslint-config-prettier`, `eslint-plugin-check-file`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-simple-import-sort`, `eslint-plugin-vitest`, `globals`, `typescript-eslint`, `@eslint/js`.
- TypeScript: `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
- Vitest: `vitest`, `@vitest/coverage-v8`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- Playwright: `@playwright/test`.
- Vite: `vite`, `@vitejs/plugin-react`.
- Tailwind: `tailwindcss`, `@tailwindcss/vite`, `prettier-plugin-tailwindcss`.

## Lint-Staged (Extend)

- Add `**/*.{js,jsx,ts,tsx}` → `["eslint --fix --max-warnings 0", "prettier --write --ignore-path .gitignore"]`.
- Extend prettier glob to include `css`: `**/*.{json,css,md,mdc}`.
- Add cspell glob for code files: `**/*.{js,jsx,ts,tsx,json,css,md,mdc}` → `cspell --no-must-find-files`.

## ESLint

- Config: `eslint.config.js` (flat config, ESM).
- Structure: define named config objects as constants, compose them in `defineConfig` array.
- Order: ignores → base JS → typescript-eslint → feature conventions → react → testing → prettier (last).
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-config-prettier` (last to disable formatting conflicts).
- Unused variables: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: "^_"`.
- Import sorting: `simple-import-sort/imports` and `simple-import-sort/exports` as errors.
- File naming: `KEBAB_CASE` for `**/*.{ts,tsx}` via `check-file/filename-naming-convention` with `ignoreMiddleExtensions: true`.
- Folder naming: `KEBAB_CASE` for `src/**/!(__tests__)` via `check-file/folder-naming-convention`.
- React hooks: use `reactHooks.configs.recommended.rules`.
- React refresh: `only-export-components` as warning with `allowConstantExport: true`.
- Vitest: apply `vitest.configs.recommended.rules` to `**/*.test.{ts,tsx}` files only.
- Global ignores: `dist`, `dist-ssr`, `coverage`, `.claude`, `.gemini`, `.vscode`, `.husky`, `test-results`, `playwright-report`, `blob-report`, `playwright/.cache`.

## TypeScript

- Build: `tsc -b` before `vite build`.
- Type check: `tsc --noEmit` as standalone script.
- Do not template full tsconfigs — use Vite scaffold defaults.
- Root `tsconfig.json` must include `tsconfig.e2e.json` in references.
- `tsconfig.app.json` must include `vitest/globals` and `@testing-library/jest-dom` in `types`.
- `tsconfig.app.json` must include `paths: { "@/*": ["./src/*"] }` to match vite alias.
- E2E tsconfig: `tsconfig.e2e.json` extending `tsconfig.node.json` with `@playwright/test` types, including `e2e/` and `playwright.config.ts`.

## Vite

- Config: `vite.config.ts`.
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`.
- Path alias: `@` → `./src`.
- Supports `VITE_BASE_URL` env variable for base path.

## Vitest

- Config: `vitest.config.ts` merging from `vite.config.ts`.
- Environment: `jsdom`.
- Globals: `true`.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`, runs `cleanup` after each test).
- Exclude: `node_modules`, `dist`, `e2e`, `.{idea,git,cache,output,temp}`.
- Coverage: `v8` provider, reporters `text`, `json`, `html`. Exclude `node_modules/`, `src/test/setup.ts`, `e2e/`.

## Playwright

- Config: `playwright.config.ts`.
- Test directory: `e2e/`.
- Base URL: `http://localhost:5173`.
- Projects: `chromium`, `firefox`, `webkit`.
- CI behavior: `forbidOnly`, 2 retries, 1 worker, `list` reporter.
- Local behavior: no retries, default workers, `html` reporter.
- Web server: `bun run dev` on port 5173, reuse existing server locally.
- Trace: `on-first-retry`.

## VS Code (Extend)

- Extensions: add `dbaeumer.vscode-eslint`, `bradlc.vscode-tailwindcss`, `ms-playwright.playwright`, `vitest.explorer`.
- Settings: add `editor.defaultFormatter: "esbenp.prettier-vscode"`, `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`, `files.associations: { "*.css": "tailwindcss" }`.

## Verify Script (Extend)

- Add steps before base checks: typecheck → lint.
- Add steps after base checks: unit tests → production build.
- Full order: typecheck → lint → format → spelling → unit tests → build.

## CI Workflow

- File: `.github/workflows/verify.yml`.
- Trigger: pull requests to `main` + `workflow_dispatch`.
- Jobs run in parallel except E2E which depends on all others.
- All jobs: checkout → setup bun (latest) → `bun install --frozen-lockfile`.
- `static-checks`: install shfmt, typecheck, lint, check:format, check:spell.
- `unit-tests`: `bun run test:coverage`.
- `build-verify`: `bun run build`.
- `e2e-tests` (needs all above): cache Playwright browsers, install chromium if cache miss, run `test:e2e --project=chromium`, upload report artifact on failure (7 day retention).

## Package Scripts (Extend)

- `dev` — `vite`
- `build` — `tsc -b && vite build`
- `preview` — `vite preview`
- `lint` — `eslint . --max-warnings 0`
- `lint:fix` — `eslint . --fix --max-warnings 0`
- `typecheck` — `tsc --noEmit`
- `test` — `vitest`
- `test:run` — `vitest run --reporter=verbose`
- `test:ui` — `vitest --ui`
- `test:coverage` — `vitest run --coverage`
- `test:e2e` — `playwright test`
- `test:e2e:ui` — `playwright test --ui`
- `test:e2e:report` — `playwright show-report`
- `check:full` — `./scripts/verify.sh && bun run test:e2e`
