---
name: create-standard
description: Why a standard needs its shape read from the meta-standard and its write surface resolved before anything is drafted
---

# Create standard requirement

## Gap

Without this skill, a standard is written from memory of what other standards look like. It arrives without the scope section that says what the file does not govern, so the next author cannot tell whether a rule belongs to it or to a sibling, and two standards end up claiming the same subject with no way to settle which one wins.

The write surface is the second failure. The toolkit authors at `standards/` and a target project holds only the installed copy under `.claude/standards/`, so a session picks whichever folder it noticed first. A toolkit standard written into the consumed copy fails the drift assertion that regenerates that folder. A standard written there in a target project is correct and looks identical, which is why the surface has to be resolved from what the project has rather than guessed.

A standard written at the root and left there is the third. The index entry and the context table are both generated or maintained downstream of the write, so a file that ships without them is catalogued nowhere and reached only by whoever already knew the path.

## Must

- Read the meta-standard before drafting, since the shape is what makes the file arguable against a sibling
- Resolve the write surface from which standards folder the project has, rather than from whichever one the session noticed first
- Confirm the slug and the full body with the user before writing
- Emit the written path in full, so the terminal can resolve it
- State what the resolved surface implies after writing, since a root file needs the consumed copy and the index regenerated and a project-local one needs copying to the toolkit to ship

## Must not

- Work the standard's shape or frontmatter from memory
- Write a snippet, which carries no frontmatter and answers to a different authoring contract

## Guards

- Neither standards folder exists: stop, since there is nowhere for the standard to live

## Out of scope

- Editing a standard that already exists
- A snippet, which `create-snippet` owns
- A path-scoped coding rule, which `create-rule` owns
- Installing and syncing the standards the toolkit ships, which the `aitk standards` commands own
