# Bun

Bun is a JavaScript runtime, bundler, and package manager. Two commands handle project creation: `bun init` for empty projects and `bun create` for templates.

## bun init

`bun init` scaffolds a new project. Pass a folder name to create it in a subdirectory, or run without arguments to scaffold in the current directory:

```bash
bun init my-app
bun init
```

It creates `package.json`, `tsconfig.json`, an entry point (`index.ts` by default), and `README.md`. When Claude CLI is detected, it also drops a `CLAUDE.md`.

Running interactively prompts for a template:

- `Blank`: empty project
- `React`: baseline React app
- `Library`: package intended for publishing

Pass `--react`, `--react=tailwind`, or `--react=shadcn` to skip the prompt and select a React variant directly. Use `--minimal` to generate only type definitions. Use `-y` to accept all defaults.

## bun create

`bun create` scaffolds from four source types.

**React component** turns an existing `.tsx` or `.jsx` file into a full dev environment. Bun analyzes the module graph, detects Tailwind class names and shadcn imports, installs missing deps, and starts a dev server:

```bash
bun create ./MyComponent.tsx
```

**npm template** downloads and runs `create-<template>` from npm:

```bash
bun create remix
```

**GitHub repo** downloads the repo, installs deps, and inits git. Optionally pass a destination folder name:

```bash
bun create user/repo
bun create user/repo my-app
```

**Local template** reads from `$HOME/.bun-create/<name>` or `<project>/.bun-create/<name>`. Supports `preinstall` and `postinstall` hooks in the template's `package.json` under a `"bun-create"` key.

Key flags: `--force` overwrites existing files, `--no-install` skips deps, `--no-git` skips git init.

## Reference

Full documentation at [bun.sh/docs](https://bun.sh/docs).
