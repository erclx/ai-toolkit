---
description: Require a route capture against a running preview after a page or route surface changes
paths:
  - '**/routes/**/*.{tsx,jsx,vue,svelte,astro}'
  - '**/pages/**/*.{tsx,jsx,vue,svelte,astro}'
  - '**/app/**/page.{tsx,jsx}'
---

# Surface capture standards

## When to capture

- Run `bun run screenshot` after changing what a route renders.
- Capture against a running preview server. Do not capture against a dev server.
- Capture every theme the route ships. Do not capture the default theme alone.

## What a capture covers

- Capture the full page at the viewport its case declares. Do not capture a component in isolation.
- Add a case to the capture record when adding a route.
- Remove a route's case in the change that removes the route.

## Sharing a capture

- Attach a capture to the pull request by hand when a reviewer needs to see it.
- Do not commit a capture. Do not remove the capture folder from `.gitignore`.
