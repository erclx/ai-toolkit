---
description: Require a capture against a running preview after a rendered surface changes
paths:
  - '**/routes/**/*.{tsx,jsx,vue,svelte,astro}'
  - '**/pages/**/*.{tsx,jsx,vue,svelte,astro}'
  - '**/app/**/page.{tsx,jsx}'
  - '**/*.html'
---

# Surface capture standards

## What a surface is

- A surface is anything the project renders for a person to look at. A framework route is one. A page the project generates is another, whoever generates it.
- Judge a generated page by the same rule as a route. Reading its markup reports nothing about how it composes.

## When to capture

- Run the project's capture command after changing what a surface renders. Report it rather than proceeding silently when the project has none.
- Capture against a running preview server. Do not capture against a dev server.
- Capture every theme the surface ships. Do not capture the default theme alone.
- Capture again after fixing a defect a capture found. A repair inside a shared stylesheet can cancel a rule written earlier in the same file.

## What a capture covers

- Capture the full page at the viewport its case declares. Do not capture a component in isolation.
- Drive a state a screenshot cannot reach. An initial render reports nothing about a menu that opens, an answer that is chosen, or a rail that tracks scrolling.
- Add a case to the capture record when adding a surface.
- Remove a surface's case in the change that removes the surface.

## Sharing a capture

- Attach a capture to the pull request by hand when a reviewer needs to see it.
- Do not commit a capture. Do not remove the capture folder from `.gitignore`.
