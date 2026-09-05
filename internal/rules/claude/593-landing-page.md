---
description: Hold the landing page's four conventions, each of which fails silently when broken
paths:
  - 'web/**'
---

# Landing page standards

The page is this repository's only outward-facing surface, and each rule below
covers a failure that ships looking correct. A build passes, a browser renders,
and the defect reaches a reader who has no way to spot it. That is why they are
a rule rather than a note in a context entry.

## Every count is read, never typed

- Read a count from the CLI at build time, the way `web/src/lib/counts.ts` reads `canon gov counts --json`. Never write a literal.
- Never add a fallback literal behind a failed read. A page that ships a stale number when the read fails is worse than one that fails the build, because nothing downstream can tell the two apart.
- State on the page where a rendered number came from. `web/src/content/copy.ts` carries `countNote` for the catalog counts and `agentView.provenance` for the session rows.

## Every image is generated, never a screenshot pasted in

- Point an image at a file some script writes. The frames under `assets/` come from `scripts/core/regen-hero.sh` and `canon capture`, and `web/public/assets/` symlinks them rather than holding a second copy.
- Say so on the page when a frame is a hand-taken snapshot that no build refreshes, which is what `boardLifecycle.note` does for the task board.
- Never hand-edit a generated artifact. A hand-edit after generation defeats the discipline silently, which is the failure `assets/captures/install.html.tmpl` documents for the terminal frames and `scripts/core/regen-agent-fixture.sh` inherits for the session rows.

## Three animations, and a fourth replaces one rather than joining it

- The page carries three: the rule card arriving in `RuleArrival.astro`, and the working marker and the row moving from Working to Completed in `AgentView.astro`.
- Replace one of the three when a section needs motion. A fourth turns a page that demonstrates into a page that decorates, and no build catches the difference.
- Give every animation a `prefers-reduced-motion: reduce` branch that still lands the state change. A transition carried by a class survives the branch where one carried by the motion alone does not.

## One structural accent, and the action color is not it

- `--color-accent` marks structure exactly once, on the rule card border in `RuleArrival.astro`. A second structural accent leaves a reader with two things claiming to be the one thing worth looking at.
- The accent has exactly three uses and the set is closed: structure, action, and status. Structure is capped at one, action is `Hero.astro` and `CallToAction.astro`, and status is the working marker in `AgentView.astro`, which is the color the surface it re-creates shows. A fourth use is not a fourth category. Argue it into one of the three or leave the accent out, because every new category arrives with a reason as good as these two and the cap holds only while the set cannot grow.
- Reach for `--color-success` or a surface and border token when a section separates a state that is not the live one, which is what `AgentView.astro` does for its completed rows.

## Before shipping

- Run `bun run web:build`, which runs `astro check` over the page. `web/` sits outside the `types` stage in `src/gate/stages.ts`, so this is the only typecheck it gets.
- Run `cd web && bunx playwright test`. The suite asserts the section count, so a section added or removed fails it by design.
