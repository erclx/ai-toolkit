---
name: migration-superseded
description: Proposes how to split a retired `.claude/` file into the folder that replaced it, reading the destination shape from the standard that folder answers to. Use when asked to "split TASKS.md", "my .claude/DIAGRAMS.md was replaced by a folder", "migrate the superseded file", or after a drift report names a superseded artifact. Do NOT write to the retired file or to its replacement, and do NOT run the untrack command. Proposal only.
---

# Migration superseded

## Guards

- If `.claude/` does not exist at `pwd`, stop: `❌ No .claude/ directory. Nothing here was superseded.`

The guard is also what makes the report's `superseded` section measured. Every section is gated on the target being toolkit-managed, and a `.claude/` directory satisfies that gate, so the empty case below is a measured empty rather than a section that never ran.

## Step 1: read the report

Run `canon sync --check . --json` from the project root. Its `superseded` array is the detection. Each entry carries `rel`, the retired file, and `replacedBy`, the folder that took its job.

An empty array is the pass: `✅ No superseded artifact. Every .claude/ file the seeds replaced is already a folder.`

### When the report is unavailable

Stop on any of three conditions, naming which one fired:

- `canon` is not on `PATH`: `❌ canon is not on PATH. The superseded section is the only detection this skill has.`
- The command exits non-zero: `❌ canon sync --check failed. Fix the report before proposing a split.`
- The report parses and carries no `superseded` key at all: `❌ This canon predates the superseded field, which reached a release in 0.46.0. Upgrade, then re-run.`

Test for the key rather than for emptiness. A current CLI reporting `"superseded": []` has looked and found nothing, which is the pass above, and reading an absent key as an empty answer reports a clean layout to the projects this skill exists for.

No listing substitutes for the field. The pairing runs against the seed folder names the toolkit ships, and an uppercase stem is not the test, so a listing of `.claude/*.md` also reaches `ARCHITECTURE.md`, `REQUIREMENTS.md`, and `DESIGN.md`. Each of those is a single file the layout intends to stay one. A fallback that proposed splitting them would shred three documents to avoid reporting a stale CLI, which is why this skill stops where its siblings degrade.

## Step 2: resolve the destination standard

### Match the folder against the catalog

Run `canon standards list --json` and match each entry's `replacedBy` against the `appliesTo` array the catalog declares. Resolve from the catalog rather than from the folder stem, so a seed folder the toolkit adds later resolves without an edit here.

Compare on the folder rather than on the exact string. An `appliesTo` value matches when it equals `replacedBy` or begins with `replacedBy` followed by a slash. The report spells the folder `.canon/tasks` and the catalog spells it `.canon/tasks/`, and `memory` declares a filename pattern beneath its folder rather than the folder itself, so string equality matches nothing the catalog actually carries and sends every entry to a decline below.

### Read the standard through the verb

A match resolves to that standard's `name`. Read it with `canon standards <name>`, which writes the document to stdout and the root it answered from to stderr.

The verb is the one route. It resolves `standards/<name>.md` at the project root first, which is where a project that authors standards of its own keeps them, and falls back to the corpus inside the canon package. No toolkit standard installs into a project, so there is no third path to test and no case where the shape is unreachable while the catalog names it.

Report the root the frame named beside the proposal. A shape read from the project's own `standards/` is the project's stated agreement, and one read from the package is the toolkit's default, which is a difference the user weighs rather than a reason to refuse.

### The states that end an entry

Four states end an entry with no proposal. Name whichever one fired rather than collapsing them, because two of them are unmeasured and two are answers:

- The catalog carries no `appliesTo` key: `⚠️ This canon emits no appliesTo, so which standard governs <replacedBy> is unread.`
- No value covers `replacedBy` and some entry carries an empty `appliesTo`: an empty array is a scope statement that did not parse, so a no-match verdict is unread rather than negative. Name the standards that did not parse.
- No value covers `replacedBy` and every array is populated: `⚠️ The toolkit ships no standard for <replacedBy>. Nothing states the destination shape.` No command fixes it, so name none.
- The standard resolved in the catalog and `canon standards <name>` exits non-zero: name the standard and the exit, since the catalog and the read disagree and only one of them can be right.

## Step 3: read the shape and map the file onto it

Read the resolved standard and take four things from it: the filename convention, the required frontmatter, the required sections, and anything the folder holds that is not an item, such as a generated `index.md` no proposal may claim.

Then read the retired file and split it at the boundary the standard implies, one destination file per item. Propose a filename per item from the convention, and name the frontmatter and sections each destination file owes.

Report what the standard leaves open rather than inventing a value for it. A convention carrying a field the retired file never recorded, such as a phase label or a verified SHA, is the user's to supply, and a proposal that fills one in reads as a decision the split already made.

## Step 4: check the ignore ordering

Run both against each `rel`, in parallel:

- `git ls-files --error-unmatch <rel> 2>/dev/null`: whether the file is tracked
- `git check-ignore -v --no-index <rel> 2>/dev/null`: whether it is ignored, and which file and line names it

`--no-index` is what makes the second read answer the question. `git check-ignore` consults the index by default and reports a tracked path as not ignored, so the flagless form returns nothing in exactly the tracked-while-ignored state this step exists to find, and the run reads a clean result off the one case that is not clean.

A file that is both tracked and ignored carries an ignore entry added after the commit. Take it out of the index first, then remove the entry `check-ignore` named:

```bash
git rm --cached <rel>
```

Reversing the two leaves the file tracked with nothing naming it, and no report catches that state. Name both steps in that order and run neither. `git rm --cached` writes the index, which is a change to the project's own history even though no content moves.

When `pwd` is not a git work tree, say the tracked check did not run rather than reporting the ordering as clear.

## Step 5: output

Print one block per superseded entry, then the shared reminder. Omit empty groups.

```markdown
## Split

`.claude/TASKS.md` → `.canon/tasks/`, shaped by `canon standards tasks`

## Proposed files

- `.canon/tasks/vXX.Y-<slug>.md` ← the "<heading>" section
- `.canon/tasks/vXX.Y-<slug>.md` ← the "<heading>" section

Each carries `title` and `description` frontmatter, an `## Outcomes` heading, and a `## Findings` heading.

## You supply

- The phase label on each filename. The retired file records no version.

## Untrack before editing the ignore entry

git rm --cached .claude/TASKS.md

Then remove the `.claude/TASKS.md` line from `.gitignore:12`.

## Reminder

Nothing above was written or run. The retired file holds content the project authored, so the split is yours to apply and the destination folder shape is what this proposal supplies.
```

Do not create the destination folder. Do not write, move, or delete the retired file. Do not run `git rm --cached`. The user applies the split after reviewing it.
