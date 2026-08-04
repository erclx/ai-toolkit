# CI workflow template

Copy this base template and adapt it to the project's stack, test commands, and build output. Add or remove jobs as needed. A new pipeline folds `static`, `unit`, and `build` into the first job and splits them out once a run log puts the gate past roughly two minutes, per the granularity rule in the skill body. `e2e` and anything gated on it stay separate jobs at either size.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  static:
    name: '🛡️ Static Checks'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run check

  unit:
    name: '🧪 Unit Tests'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run test

  build:
    name: '📦 Build Check'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  e2e:
    name: '🎭 E2E Tests'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-results
          path: test-results/
          retention-days: 7
```
