---
title: Demo
description: Beats compiler and browser driver behind canon demo, why the plan is a second committed artifact, and the gotchas in painting a pointer inside the page
---

# Demo

## Overview

`canon demo` drives a project's running application and writes a recording and a still. The command surface, its flags, and its refusal reasons live in `docs/agents/demo.md`. This entry holds why it is shaped the way it is.

The whole feature came out of `.canon/groundwork/38-demo-recorder/`, which measured three spikes on 2026-08-19 and settled that the browser engine already in this repository can produce a video from a driven page with no editor and no desktop recorder. Read `06-decision.md` there before changing anything structural.

## Layout

- `src/demo/beats.ts`: reads the human-facing draft `canon-screencast` writes
- `src/demo/compile.ts`: the plan type, the beats-to-plan transform, and validation of a plan read back off disk
- `src/demo/pointer.ts`: cursor resource decoding, hotspot scaling, and the script injected into the page
- `src/demo/cursors.ts`: the bundled vector artwork for the three pointer states
- `src/demo/theme.ts`: reads a cursor theme folder for `--cursor`
- `src/demo/drive.ts`: every browser reference the feature adds
- `src/browser/engine.ts`: the install command, the two ways the engine can be absent, the unreachable-server test, and the keyboard-modality press, shared with `canon inventory` and `canon drive` as each became the next command needing them
- `src/demo/container.ts`: converts the webm the driver wrote into mp4, and into a gif behind `--gif`, as post-steps the compiler and the driver never see
- `src/commands/demo.ts`: wiring only, with the driver behind a dynamic import

## Decisions

- **The plan is a second artifact rather than four more fields on a beat.** A beat is drafted through four discovery questions and pre-seeded so a person edits down, and a selector, a URL, a wait condition, and a timing on every beat destroys that property. The compiler also has to translate, since the engine's overlay carries the action it performed rather than the beat's caption, and a translation step is a compiler rather than a field.
- **The plan is committed, not scratch.** It was going to sit beside the draft under `.canon/tmp/`, and it fails the deletable test on its timing: the numbers are tuned by watching a recording and the draft cannot reproduce a tuned value. That is also why `compile` refuses to overwrite an existing plan without `--force`, since a recompile is the same loss by another route.
- **The command ships to targets, and it was the first browser command to.** Capture was excluded from the published package because it regenerated images committed here, a reason that did not transfer to a command whose purpose is running in someone else's project, so `src/demo/` shipped and a target inherits a browser binary install. The engine moved from a development dependency to a runtime one for this, and `src/capture/` has since taken the same import and started shipping too.
- **The pointer moves through the engine's pointer, never the element-clicking helper.** The helper resolves a target and jumps to it. Interpolated movement is the entire trick, and one step is what makes a cursor teleport.
- **`--out` names a directory in both verbs and never a root.** It first meant the directory on `compile` and a root on `run`, which resolved the plan's own directory a second time and nested the output path inside itself. `drive` now takes resolved paths rather than a root plus a relative path.
- **The bundled artwork is drawn rather than lifted from a theme.** A theme lives on one machine, and a target has none to point at on first run. `--cursor` reads one for an operator who has it.
- **Pointer travel is a duration, and the step count is derived rather than fixed.** A step is a round trip to the browser, so a fixed count set a message rate rather than a duration, and the same plan produced recordings 26 percent apart on byte-identical input. `compile.ts`'s `deriveSteps` divides the plan's `pointer.travelMs` by a round trip `drive.ts` measures on the first real move, not on a blank page, since layout, paint, and page script are what a step actually pays for.
- **The caption is a DOM overlay next to the pointer's, not the engine's own annotation.** `showActions` names the Playwright call it made, never the beat's narration, so `drive.ts` installs a second `addInitScript` alongside the pointer's and updates it after each step's action runs, before the hold that follows.
- **`showActions` is off, because the pointer and the caption each replaced half of it.** Both overlays were added as supplements while the annotation stayed on, so a recording carried four overlays where two were wanted: the engine's dot beside a real cursor, and its `Mouse move` title beside the beat's narration. `plan.annotations` keeps its three fields as a dormant record of what that annotation was configured with, since a plan committed before this carries them and nothing reads them now.
- **A scroll step centres its target rather than revealing it.** `scrollIntoViewIfNeeded` scrolls the least it can, which leaves a target taller than the remaining space flush against the bottom edge. Measured on this repository's own recording at 225 pixels of dead space above the content and 2 below, against 114 and 113 for a centred one.
- **mp4 is a post-step, not a compiler or driver concern.** `container.ts` shells out to `ffmpeg` through `execa` once the driver has already written the webm, writes beside it rather than instead of it, and degrades a missing or failing converter to a warning rather than failing a run whose recording already succeeded.
- **The gif is opt-in where the mp4 is not, and the split is destination rather than cost.** A gif runs several times the size of the webm it derives from and one destination needs one, a README on a host that strips a video tag, so `--gif` gates it while the mp4 stays unconditional for the opposite reason. The filter generates a palette from the source and applies it rather than quantizing per frame, since a per-frame palette is what makes a recording of flat interface colors band and shimmer.

## Gotchas

- **The pointer is a page element and inherits the page's world.** A site with its own element at that id, a stacking context that outranks it, or a style rule reaching it will interfere. It also installs before navigation, so driving an already-open page needs a reload.
- **A repeated attribute in the bundled artwork renders as a broken image rather than raising.** A second `fill` on a path that already carried one produced a broken-image glyph in a recording and in a still, and nothing failed. `src/demo/pointer.test.ts` walks each state's markup for a repeated attribute because of it.
- **Resolving a target through its bounding box assumes it is in the viewport.** A target below the fold needs a `scroll` step ahead of it, and a scrolled page moves the pointer under a fixed-position element in ways nothing has exercised.
- **Three of nineteen cursor states are handled.** A drag, a resize, or a wait shows an arrow, and the two animated states have no still frame at all.
- **Pause and typing timing are still unsolved.** `HOLD_MS`, `FINAL_HOLD_MS`, and `TYPE_DELAY_MS` are tuned to look right on one fixture, and they are the difference between a demo that reads as deliberate and one that reads as slow. Pointer travel dropped off this list once it moved to a duration, covered under Decisions.
- **CI does not run the browser test.** `src/demo/drive.e2e.test.ts` skips when no browser binary is present and CI installs none, so a green pipeline is not evidence it passed. Run it locally.
- **The launch count in this file has grown past where it once wedged, without wedging again.** A third `drive` call once timed out at two minutes here after two finished clean, cause never found. Two caption cases since raised the count to five launches, and four separate local runs have each finished clean in eleven to twelve seconds. That clears this shape of the wedge, not the wedge itself.
