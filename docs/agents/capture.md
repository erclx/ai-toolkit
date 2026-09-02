---
title: Capture
description: Rendering HTML sources to PNG, what the command asserts about fonts, and why the selector has no default
---

# Capture

`canon capture [source] --selector <sel>` renders HTML sources to PNG, which is how a generated documentation image is rebuilt from the markup it was generated out of. The source defaults to `assets/`, where a directory expands to every `.html` directly inside it, so adding a capture means dropping a file beside the first one and running the same command.

```bash
canon capture --selector .window
canon capture assets/install.html --selector .window
canon capture assets --selector .window --out .canon/review/captures
```

`--selector` is required and every example above passes it. The element a capture crops to belongs to the page, not to the command, so there is no value that could be right for an arbitrary project's markup. `.window` is what this repository's own five sources declare, and a project renders its own pages by naming whatever theirs declare.

## What this repository captures

`assets/` here holds five sources, so one run over the folder rebuilds every one. None is edited by hand. `scripts/core/regen-hero.sh` writes each from a template beside it, filling one shared value map into all of them, and `bun run check` regenerates them and fails on the difference.

Three of the five take catalog data, so a stack gaining a rule moves the frame on the next run. `install.html` and `showcase-task-board.html` are the two exceptions: the first holds terminal text from a real run and the second holds a hand-frozen snapshot of a gitignored board, each in its template rather than derived from a live catalog at build time.

The folder is read flat and never descends, by the regeneration script, by this command, and by the drift stage alike. A source in a subfolder is skipped by all three with nothing reported, so a new frame takes a name prefix rather than a folder of its own.

Only the HTML is asserted for drift. The PNG is a chromium render whose bytes move with the browser version, so rebuild it with `canon capture assets --selector .window` when the check reports the HTML changed.

Every render writes a stamp beside its PNG, `hero.png` next to `hero.stamp`, holding the source filename, a `source-sha256` over the markup bytes it read, and an `image-sha256` over the image bytes it wrote. Both digests are what `bun run check` compares, so a markup edit committed without a capture and a PNG swapped under unchanged markup each fail. The stamp is tracked and commits alongside the pair. Nothing hand-edits it, and a capture that cannot write it reports that source as failed and exits 1, so an image whose stamp never landed is reported rather than passed over.

| Option             | Behavior                                          |
| ------------------ | ------------------------------------------------- |
| `--out <dir>`      | Write every PNG here instead of beside its source |
| `--selector <sel>` | Element to capture, required and never defaulted  |

## What the command asserts

Each source renders at `deviceScaleFactor` 2 with a transparent background, and the success line reports the pixel dimensions the element wrapped to. Size is reported and never asserted. The height of a terminal frame is whatever its text wrapped to at a fixed width, so pinning that number would harden an accident.

What is asserted is the font. The command reads the first family the captured element declares and fails when the browser did not resolve it, because a fallback face rewraps the block and silently changes the output. Sources therefore name a real font rather than relying on `monospace`. A source that cannot render reports its own line and exits 1 without dropping the rest of the batch.

A run refuses before it reads anything else when `--selector` is absent, naming the flag and pointing at `--help`. Ordering it first is what keeps the message about the invocation: the source defaults to `assets`, so checking that first would answer `assets not found` from whatever directory the caller happened to be in and say nothing about the flag that was actually missing.

The browser binary installs separately from the package. A first run does `bunx playwright install chromium` once, and a run that cannot launch one reports the engine's own remediation inside the frame and exits 1 rather than escaping as a stack trace.

The command ships to targets, alongside `demo`, `inventory`, and `drive`. It was held back while its only caller was this repository regenerating its own committed images, which described the caller rather than the render. A project has generated pages of its own, and the command that would show them rendering and prove their fonts resolved was the one it could not run.

Shipping it also fixed what the exclusion was hiding. The render module imported the `@playwright/test` development dependency, which no published tarball carries. Every browser reference still sits behind a dynamic import, so a browser loads for this command rather than in front of every other one.

`demo.md` and `driver.md` cover two of the other three browser commands. What separates this one is that a capture renders a single state from a file on disk, where the rest drive a running application.
