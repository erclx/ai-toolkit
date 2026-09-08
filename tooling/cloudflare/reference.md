# Tooling cloudflare reference

## Overview

The cloudflare stack ships one parameterized GitHub Actions workflow that deploys a static build to Cloudflare Pages. It is keyed on host rather than on framework and carries no dependencies, seeds, or scripts of its own, so it syncs onto a project already carrying `astro`, `vite-react`, or any other stack at the same root without colliding.

## Deploy workflow

- Separate `build` and `deploy` jobs, connected by an uploaded artifact, converged on the shape already running in the closest prior art rather than invented fresh.
- The deploy job checks for `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` before doing anything else, and skips with a `::notice::` rather than failing when either is absent. A first merge lands ahead of the Pages project existing, and this guard is what keeps that push green.
- `--branch=${{ github.ref_name }}` on every deploy, which gives every branch a Cloudflare preview URL rather than only `main`.
- The deploy job checks out the repository and installs Bun even though it builds nothing. `wrangler-action` resolves its package manager from `bun.lock` in the checkout, and dropping that step breaks the deploy on every push once the toolchain it relies on silently goes missing.

## Parameters a project fills in by hand

Three values in the seeded file have no generic default and are set once, right after sync:

- The `paths:` filter under the `push` trigger. The shipped default is a single `src/**` glob. Widen it to cover every path the build reads when the build draws on catalogs or generated content living outside `src/`.
- The `concurrency.group` name. The shipped default is the bare string `deploy`, which is enough for a single-deploy project. Give it a project-specific name only if the project runs more than one deploy workflow.
- The `--project-name` flag on the `wrangler pages deploy` command. Set it to the name the `deploy-cloudflare` skill creates the Pages project under.

## Re-sync

`configs/` is golden and always overwrites. Re-running `canon tooling sync cloudflare . --write` after hand-editing any of the three parameters above discards that edit and restores the shipped defaults. Re-fill the parameters after any re-sync rather than expecting the file to preserve them.
