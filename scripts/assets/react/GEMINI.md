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
