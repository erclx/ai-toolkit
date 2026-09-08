---
name: draft-slides
description: Why the skill owns deck content and the CLI owns layout, and why one render is read back before the deck is called done
---

# Draft slides requirement

## Gap

Without this skill, a deck request turns into hand-built layout. The session invents layout names the renderer does not have, so the render falls back or fails, and it writes centered body text and bullet lines that overflow the slide because nothing told it the type scale is fixed. Every slide comes out as a title over bullets, which is the shape that needs no decision and reads as a document rather than a deck.

Reimplementing spacing and palette logic is the failure that survives the session. The CLI already owns both, so a deck that styles itself drifts from every other deck and stops being recognizable. And a first render shipped unread hands the audience the overlap and the overflow, since a source that looks correct says nothing about the picture it produces.

## Must

- Read the layout catalog from the CLI before drafting and pick only from what it returns
- Match the content shape to the layout, since each one parses a different body
- Vary layouts across the deck rather than repeating one
- Size content to fit the fixed type scale, keeping titles short and bullet lines tight
- Shell out to the render command for the deck itself
- Run one QA pass over the rendered images and fix what it reports

## Must not

- Hardcode a layout name, which goes stale the moment the catalog changes
- Reimplement layout, palette, or type scale, which the CLI owns
- Write centered body text or content that overflows a slide
- Loop on aesthetics past a single fix pass

## Guards

- Image conversion tools missing: skip the image pass and say so. Do not fail the render over a verification step.

## Out of scope

- Rendering, which the CLI owns end to end
- The palette and the type scale, which live in the CLI rather than in the source
- Writing the content the deck is about, which the caller brings
- Recording a demo, which `draft-screencast` owns
