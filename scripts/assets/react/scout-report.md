# 🕵️ Deep Scout Report: 2026-01-23

## 1. Executive Summary
- **Intent:** Template
- **Status:** Initialized/Starter Kit
- **Risk:** Low (Standard template, recent major versions of frameworks)

## 2. Architecture & Environment
- **Archetype:** TypeScript/React/Vite Template
- **Runtime:** Node 20.0.0
- **Manager:** bun
- **Frameworks:**
  - React: 19.2.0
  - Vite: 7.2.4
  - Tailwind CSS: 4.1.18
  - Tanstack Query: 5.90.16
  - Vitest: 4.0.16
  - TypeScript: ~5.9.3
  - ESLint: 9.39.2
- **Paradigm Shifts:**
  - React 19 (Major version)
  - Tailwind CSS 4 (Major version)
  - ESLint 9 (Flat Config)
  - Vitest 4 (Major version)

## 3. Workflows & Constraints
- **Lifecycle:**
  - **Dev:** `bun run dev`
  - **Build:** `bun run build`
  - **Verify:** `bun run verify`
  - **Test:** `bun run test`
- **Contracts:**
  - **Styling:** Tailwind CSS (v4)
  - **Testing:** Vitest (Colocated with `**/*.test.{ts,tsx}`), JSDOM environment, React Testing Library.
  - **Imports:** Absolute (`@/*` mapping to `./src/*`)
  - **Strictness:** TypeScript Strict (`strict: true` in tsconfig)

## 4. Directory Structure
- Standard Vite/React project structure.
- `src` directory contains `components`, `config`, `features`, `hooks`, `lib`, `test`, `utils`.
- Dedicated `scripts` directory for various utility shell scripts.
- `.vscode` for editor-specific settings.
- `.husky` for Git hooks.
- ESLint configuration using flat config (`eslint.config.js`).

## 5. Observations
- Project is configured as a private module (`"private": true`).
- Uses Bun as the package manager (indicated by `bun.lock`).
- Utilizes new ESLint flat configuration.
- `lint-staged` and `commitlint` are set up for code quality and commit message conventions.
- `cspell` is used for spell checking.
