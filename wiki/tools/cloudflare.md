---
title: Cloudflare Pages
description: The truncated account ID quirk and the build-free toolchain requirement that broke a deploy once and cost two comments to explain
---

# Cloudflare Pages

Cloudflare Pages deploys a static site from a GitHub Actions workflow through `wrangler pages deploy`. Two facts about that setup have each cost a broken deploy to learn, and neither lives anywhere a project reads before repeating the mistake. Source: Cloudflare, and separately the `wrangler-action` maintainer for the toolchain behavior below.

## The account ID is truncated in the dashboard

The Cloudflare dashboard displays the account ID in a shortened form. Copying the visible text pastes a truncated value into `CLOUDFLARE_ACCOUNT_ID`, and the deploy fails against a value that looks plausible. Copy the ID with the dashboard's copy button rather than selecting the displayed text by hand.

## A deploy job that builds nothing still needs a toolchain

`wrangler-action` resolves its package manager from the checkout it runs in. It reads `bun.lock`, picks Bun on the strength of it, and installs `wrangler` through that. A deploy job that only uploads a prebuilt artifact still needs Bun on `PATH` for this reason, even though the job itself runs no build step. Dropping the checkout and toolchain setup as apparent dead weight has broken a deploy on every subsequent push.
