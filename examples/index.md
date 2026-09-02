---
title: Examples
subtitle: Worked sources demonstrating what a toolkit command produces
auto: false
---

# Examples

Worked sources demonstrating what a toolkit command produces.

- [`slides/showcase.md`](slides/showcase.md): a `SLIDES.md` source exercising the layout catalog end to end. Render it with `canon slides render --source examples/slides/showcase.md`. Source only. No output is committed beside it, and none can be: `src/slides/render.ts` emits `.pptx` only, and no page route exists to display that format.
