# TOOLING VITE REACT REFERENCE

> Extends: `tooling-base.md`. Apply base reference first.

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
- Unused variables: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: "^_"` to allow intentionally unused params.
- Import sorting: `simple-import-sort/imports` and `simple-import-sort/exports` as errors.
- File naming: `KEBAB_CASE` for `**/*.{ts,tsx}` via `check-file/filename-naming-convention` with `ignoreMiddleExtensions: true`.
- Folder naming: `KEBAB_CASE` for `src/**/!(__tests__)` via `check-file/folder-naming-convention`.
- React hooks: use `reactHooks.configs.recommended.rules`.
- React refresh: `only-export-components` as warning with `allowConstantExport: true`.
- Vitest: apply `vitest.configs.recommended.rules` to `**/*.test.{ts,tsx}` files only.
- Global ignores: `dist`, `dist-ssr`, `coverage`, `.claude`, `.gemini`, `.vscode`, `.husky`, `test-results`, `playwright-report`, `blob-report`, `playwright/.cache`.

```js
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import checkFile from 'eslint-plugin-check-file'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import vitest from 'eslint-plugin-vitest'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const ignoreConfig = globalIgnores([
  'dist',
  'dist-ssr',
  'coverage',
  '.claude',
  '.gemini',
  '.vscode',
  '.husky',
  'test-results',
  'playwright-report',
  'blob-report',
  'playwright/.cache',
])

const featureConfig = {
  name: 'feature/conventions',
  plugins: {
    'simple-import-sort': simpleImportSort,
    'check-file': checkFile,
  },
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'check-file/filename-naming-convention': [
      'error',
      { '**/*.{ts,tsx}': 'KEBAB_CASE' },
      { ignoreMiddleExtensions: true },
    ],
    'check-file/folder-naming-convention': [
      'error',
      { 'src/**/!(__tests__)': 'KEBAB_CASE' },
    ],
  },
}

const reactConfig = {
  name: 'feature/react',
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}

const testConfig = {
  name: 'feature/testing',
  files: ['**/*.test.{ts,tsx}'],
  languageOptions: {
    globals: vitest.environments.env.globals,
  },
  plugins: { vitest },
  rules: {
    ...vitest.configs.recommended.rules,
  },
}

export default defineConfig([
  ignoreConfig,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  featureConfig,
  reactConfig,
  testConfig,
  eslintConfigPrettier,
])
```

## TypeScript

- Build: `tsc -b` before `vite build`.
- Type check: `tsc --noEmit` as standalone script.
- Do not template full tsconfigs — use Vite scaffold defaults.
- Root `tsconfig.json` must include `tsconfig.e2e.json` in references.
- `tsconfig.app.json` must include `vitest/globals` and `@testing-library/jest-dom` in `types`.
- `tsconfig.app.json` must include `paths: { "@/*": ["./src/*"] }` to match vite alias.
- E2E tsconfig: `tsconfig.e2e.json` extending `tsconfig.node.json` with `@playwright/test` types, including `e2e/` and `playwright.config.ts`.

## Vite Config

- Config: `vite.config.ts`.
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`.
- Path alias: `@` → `./src`.
- Supports `VITE_BASE_URL` env variable for base path.

```ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
```

## Vitest

- Config: `vitest.config.ts` merging from `vite.config.ts`.
- Environment: `jsdom`.
- Globals: `true`.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`, runs `cleanup` after each test).
- Exclude: `node_modules`, `dist`, `e2e`, `.{idea,git,cache,output,temp}`.
- Coverage: `v8` provider, reporters `text`, `json`, `html`. Exclude `node_modules/`, `src/test/setup.ts`, `e2e/`.

```ts
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default defineConfig((configEnv) =>
  mergeConfig(
    typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts',
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/e2e/**',
          '**/.{idea,git,cache,output,temp}/**',
        ],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: ['node_modules/', 'src/test/setup.ts', 'e2e/'],
        },
      },
    }),
  ),
)
```

## Playwright

- Config: `playwright.config.ts`.
- Test directory: `e2e/`.
- Base URL: `http://localhost:5173`.
- Projects: `chromium`, `firefox`, `webkit`.
- CI behavior: `forbidOnly`, 2 retries, 1 worker, `list` reporter.
- Local behavior: no retries, default workers, `html` reporter.
- Web server: `bun run dev` on port 5173, reuse existing server locally.
- Trace: `on-first-retry`.

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
```

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

```yml
name: Verify

on:
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  static-checks:
    name: 🛡️ Static Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Dependencies
        run: bun install --frozen-lockfile

      - name: Install shfmt
        run: sudo apt-get install -y shfmt

      - name: Type Check
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Check Formatting
        run: bun run check:format

      - name: Check Spelling
        run: bun run check:spell

  unit-tests:
    name: 🧪 Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Dependencies
        run: bun install --frozen-lockfile

      - name: Run Vitest
        run: bun run test:coverage

  build-verify:
    name: 📦 Build Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Dependencies
        run: bun install --frozen-lockfile

      - name: Build Project
        run: bun run build

  e2e-tests:
    name: 🎭 E2E Tests
    needs: [static-checks, unit-tests, build-verify]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Dependencies
        run: bun install --frozen-lockfile

      - name: Get Playwright Version
        id: playwright-version
        run: echo "VERSION=$(bunx playwright --version | awk '{print $2}')" >> $GITHUB_OUTPUT

      - name: Cache Playwright Browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ steps.playwright-version.outputs.VERSION }}

      - name: Install Playwright Browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: bunx playwright install chromium --with-deps

      - name: Run Playwright Tests
        run: bun run test:e2e --project=chromium

      - name: Upload Playwright Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Package Scripts (Extend)

- `dev` — vite dev server.
- `build` — `tsc -b && vite build`.
- `preview` — vite preview.
- `lint` — eslint with `--max-warnings 0`.
- `lint:fix` — eslint fix with `--max-warnings 0`.
- `typecheck` — `tsc --noEmit`.
- `test` — vitest watch mode.
- `test:run` — vitest single run with verbose reporter.
- `test:ui` — vitest UI.
- `test:coverage` — vitest with coverage.
- `test:e2e` — playwright test.
- `test:e2e:ui` — playwright UI mode.
- `test:e2e:report` — playwright show report.
- `check:full` — `./scripts/verify.sh && bun run test:e2e`.
