---
name: create-snippet
description: Why a snippet needs its shape read from the reference and its write surface resolved before anything is drafted
---

# Create snippet requirement

## Gap

Without this skill, a snippet is drafted the way any other markdown file is drafted, so it arrives carrying frontmatter, headings, and a fill-in placeholder. None of the invocation channels strip those. Typing `>slug` in a chat inserts the scaffolding verbatim, and the file that was meant to be one instruction reads as a document.

The write surface is the second failure. The toolkit authors at `snippets/` and a target project holds only the installed copy under `.claude/snippets/`, so a session picks whichever folder it noticed first. A toolkit snippet written into the consumed copy fails the drift assertion that regenerates that folder. A snippet written there in a target project is correct and looks identical, which is why the surface has to be resolved from what the project has rather than guessed.

Inside the project surface, a third failure sits one level deeper. A project-authored snippet sharing a name with a toolkit one used to be indistinguishable from it, so `aitk snippets sync` could not tell which side owned the file. The sync engine now reads ownership by location for anything under `.claude/snippets/project/`, so the skill has to write there rather than beside the toolkit-installed files.

## Must

- Read the bundled snippet reference before drafting, since the shape rules are what the invocation channels depend on
- Resolve the write surface from which snippet folder the project has, rather than from whichever one the session noticed first
- On the project surface, write under its `project/` subfolder so the sync engine reads the file as project-authored by location
- Confirm the slug and the full body with the user before writing
- Emit the written path in full, so the terminal can resolve it
- State what the resolved surface implies after writing, since a root file needs the consumed copy regenerated and a project-local one needs copying to the toolkit to ship

## Must not

- Restate the snippet authoring conventions in the body, which the bundled reference owns and which would drift from it
- Write a standard, which answers to a different authoring contract

## Guards

- Neither snippet folder exists: stop, since there is nowhere for the snippet to live

## Out of scope

- Editing a snippet that already exists
- A standard, which `create-standard` owns
- Installing and syncing the snippets the toolkit ships, which the `aitk snippets` commands own
- What a snippet is and how it is invoked, which the bundled snippet reference states
