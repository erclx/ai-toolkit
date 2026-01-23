#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_fail() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; }

use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  log_step "Pre-Flight: Injecting Real-World Context"
  
  mkdir -p .gemini/.tmp

  cat <<'EOF' > GEMINI.md
# GEMINI.md - Project Context

This document provides an overview of the project's structure, technologies, and development practices for the Gemini CLI agent.

## Project Overview

This is a **Vite + React + Bun Template** designed to provide a robust and streamlined development experience for React applications. It emphasizes quality assurance through pre-configured tools and automated workflows.

**Key Features:**
* **Environment Validation:** Zod for runtime validation of environment variables.
* **Styling:** Tailwind CSS v4.
* **Architecture:** Feature-based directory structure, organizing code by domain.
* **Quality Gates:**
    * Pre-commit linting (Lint-Staged).
    * Pre-push verification (Husky).
    * ESLint and Prettier for code quality and formatting.
    * CSpell for automated spell checking.
    * Strict filename enforcement (kebab-case).
* **Testing:** Vitest with jsdom for component testing, including UI and coverage reporting.
* **Build Tool:** Vite for fast development and optimized builds.
* **Package Manager/Runtime:** Bun.
* **Development Experience:** Path aliasing (`@` maps to `src/`).
* **Automated Releases:** SemVer releases via bash scripts, integrated with GitHub CLI.

## Technologies Used

* **Framework/Library:** React
* **Build Tool:** Vite
* **Package Manager/Runtime:** Bun
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4
* **State Management:** (Implicitly React's built-in hooks, no explicit global state library mentioned)
* **Testing:** Vitest, jsdom
* **Code Quality:** ESLint, Prettier, CSpell, Lint-Staged, Husky, eslint-plugin-check-file
* **Validation:** Zod (for environment variables)

## Building and Running

### Installation

```bash
git clone [https://github.com/your-username/vite-react-template.git](https://github.com/your-username/vite-react-template.git) my-app # (Replace with actual repo)
cd my-app
chmod +x scripts/setup.sh && ./scripts/setup.sh
```
The `setup.sh` script handles initial project configuration, including updating metadata, resetting git history, and then self-destructs.

### Local Development

To start the development server:
```bash
bun run dev
```

### Build

To create a production build:
```bash
bun run build
```

### Testing

* Run Vitest in watch mode:
    ```bash
    bun run test
    ```
* Launch Vitest UI:
    ```bash
    bun run test:ui
    ```
* Generate coverage report:
    ```bash
    bun run coverage
    ```

### Quality Gate (Verification)

To run a full suite of quality checks (types, lint, format, spell, test):
```bash
bun run verify
```

### Other Workflow Commands

* `bun run release`: Bumps version, creates a release branch and PR (requires GitHub CLI).
* `bun run publish`: Tags release, creates GitHub Release.
* `bun run update`: Interactive dependency updates and verification.
* `bun run clean`: Purges `node_modules`, `dist`, and cache.
* `bun run lint:fix`: Automatically fixes ESLint and Prettier issues.
* `bun run spell`: Checks spelling with CSpell.

## Project Structure

```text
src/
├── components/      # Shared UI components (buttons, inputs)
├── features/        # Domain-specific modules (e.g., authentication, user feed)
├── hooks/           # Shared React hooks
├── config/          # Configuration files, notably environment validation (`env.ts`)
├── utils/           # General utility functions
├── lib/             # External/third-party configurations or integrations
├── test/            # Test utilities and mocks
├── app.tsx          # Main root component of the application
└── main.tsx         # Entry point for the React application
```

## Configuration

### Environment Variables

Environment variables are managed via `.env` files and validated at runtime using Zod.

1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Configure necessary variables (e.g., `VITE_API_URL`):
    ```properties
    VITE_API_URL=[https://api.example.com](https://api.example.com)
    ```
3.  Add or modify environment variables by updating the Zod schema in `src/config/env.ts`.

## Development Conventions

* **Code Style & Formatting:** Enforced by ESLint and Prettier.
* **Commit Messages:** (Implicitly Conventional Commits, given the presence of `commitlint.config.mjs`).
* **Filename Convention:** Strict kebab-case enforced.
* **Testing:** Unit and component testing using Vitest.
* **Branching Strategy:** (Implicitly GitFlow or similar, given release automation).
* **Dependency Management:** Bun.
* **Environment Setup:** Initialized via `scripts/setup.sh`.
EOF

  cat <<'EOF' > .gemini/.tmp/scout_report.md
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
EOF

  log_info "Mock Environment Loaded: Vite + React 19 + Tailwind v4 + Bun"
}

stage_verify() {
  local log_file=$1
  local cursor_rules=".cursorrules"
  local pkg_rule=".cursor/rules/package-manager.mdc"
  local tech_rule=".cursor/rules/tech-stack.mdc"

  log_step "Verifying Cursor Rules Generation"

  if [ -f "$cursor_rules" ]; then
    if grep -q "Vite + React + Bun Template" "$cursor_rules"; then
       log_info "Global: Constitution correctly merged."
    else
       log_fail "Global: Constitution missing project overview."
       return 1
    fi

    if grep -q "Project Reality" "$cursor_rules"; then
       log_info "Global: Scout Reality section appended."
    else
       log_fail "Global: Scout Reality section missing."
       return 1
    fi
  else
    log_fail "Artifact Missing: .cursorrules"
    return 1
  fi

  if [ -f "$pkg_rule" ]; then
    if grep -q "bun" "$pkg_rule" && grep -q "NEVER use npm" "$pkg_rule"; then
       log_info "Rule: Package Manager strictly enforces Bun."
    else
       log_fail "Rule: Package Manager rule is lax or incorrect."
       return 1
    fi
  else
    log_fail "Artifact Missing: $pkg_rule"
    return 1
  fi

  if [ -f "$tech_rule" ]; then
    if grep -iq "Tailwind" "$tech_rule" && grep -q "4" "$tech_rule"; then
       log_info "Rule: Tailwind v4 paradigm detected."
    else
       log_fail "Rule: Failed to detect Tailwind v4."
       return 1
    fi
    
    if grep -iq "React" "$tech_rule" && grep -q "19" "$tech_rule"; then
       log_info "Rule: React 19 paradigm detected."
    else
       log_fail "Rule: Failed to detect React 19."
       return 1
    fi
  else
    log_fail "Artifact Missing: $tech_rule"
    return 1
  fi

  return 0
}