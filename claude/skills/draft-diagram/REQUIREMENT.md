---
name: draft-diagram
description: Why diagrams are a folder of per-kind entries rather than one file, and why the verified marker is spent only on a render that was read back
---

# Draft diagram requirement

## Gap

Without this skill, a session asked to refresh one view rewrites the whole surface, so four diagrams nobody checked change in the same commit and the reviewer cannot tell which one the pass was about. It picks a filename of its own, and the next refresh writes a duplicate beside the old entry instead of finding it. It reaches for C4, state, or class diagrams that render differently in every viewer.

The verification failure is the expensive one. A mermaid source can satisfy every rule in the standard and still render as a picture that asserts something false about the system, so a session that judges the source and stamps the entry as verified has spent the only signal a reader has on a diagram nobody looked at. The standards hook toggles off inside a fenced block, so a banned character in a node label passes silently while the same character one line below is caught.

## Must

- Write one entry per kind under the filename and category the standard fixes, so a later refresh finds its target
- Pick which entries this pass writes from whether the source signal exists and whether the pass has reason to touch it
- Stay inside `flowchart` and `sequenceDiagram`
- Render every entry this pass wrote and read the image back against what the entry means to say
- Stamp the verified marker only on an entry whose render was read back and judged correct
- Name every skipped render and every surviving defect in the output
- Regenerate the catalog from sibling frontmatter after the last entry is written
- Read the node labels by hand, since no hook checks inside a fence

## Must not

- Rewrite an entry this pass had no reason to touch, or report one as written when it was left alone
- Stamp an untouched entry, a skipped render, or an entry whose defect survived
- Report a clean verification when a check did not run
- Commit a render, which is a verification artifact rather than a deliverable
- Redraw a diagram during a migration pass, since a rewrite and a move landing together leaves no way to tell which one broke it
- Loop on a defect past two correction passes

## Guards

- No architecture file, no requirements file, and no folder structure to scan: stop, because nothing anchors a diagram
- Render fails for any reason: continue to the output and name the skipped check. A missing renderer degrades the loop rather than failing it.
- `canon` not on PATH: report the catalog as stale rather than hand-editing it

## Out of scope

- Design tokens and the visual system, which `design-extract` owns
- UI roughness, which `ux-audit` owns
- Writing the catalog file, which the index regen owns from frontmatter
- Deleting a pre-split flat diagrams file after a migration, which stays the user's call
