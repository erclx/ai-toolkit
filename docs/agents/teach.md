---
title: Teach
description: Listing learning workspaces and the ordinal a new one takes, opening one with its required files, recording sources and glossary terms, the refusal reasons, and why every write here runs through a verb
---

# Teach

Learning workspaces sit under `.claude/teach/<nn>-<topic>/`, and `standards/teach.md` fixes their layout, naming, and file formats. Every verb here resolves that folder against the main worktree root rather than against the working directory, so a session standing in a linked worktree reaches the one workspace the learner has rather than opening a second.

That root resolution is also why the writing verbs exist at all. The file-editing tools refuse a main-root path from a linked worktree and offer a worktree copy instead, and a caller naming only the destination reports a success that did not happen. A whole-file create still goes out as a shell heredoc. Changing a line inside a file that already exists has no shell route, because the stream editors are banned, so `resource` and `glossary` are the route for the two files a running workspace edits.

## List

`aitk teach list` reports the workspaces under `.claude/teach/`, or what one workspace holds. It reads and never writes.

```bash
aitk teach list
aitk teach list regular-expressions --json
```

| Option          | Behavior                                    |
| --------------- | ------------------------------------------- |
| `--json`        | Emit a machine-readable record on stdout    |
| `--root <path>` | Teach root, defaulting to the main worktree |

With no topic it reports one line per workspace, carrying the lesson, learning-record, reference-page, and glossary-term counts, plus `next`, the ordinal an open would take. With one it reports the filenames behind each count and the glossary entries themselves.

A folder not named `NN-<topic>` is still listed rather than dropped, since dropping it hides the one folder that needs a fix. Its ordinal reads as absent, it sorts last, and it moves no ordinal, so a malformed name cannot push a new workspace into a number a reader already cites.

The listing also names the required files a workspace does not carry, which is `MISSION.md`, `RESOURCES.md`, and `GLOSSARY.md`. That is a report rather than a refusal, because a workspace missing one is still a workspace a session can resume.

## Open

`aitk teach open` creates a workspace at the next ordinal and writes all three required files.

```bash
aitk teach open regular-expressions \
  --subject "Reading and writing regular expressions" \
  --starting-point "Comfortable with the shell, has never written a group" \
  --success "Write a pattern matching a date" \
  --success "Explain what a backreference does"
```

| Option                    | Behavior                                                    |
| ------------------------- | ----------------------------------------------------------- |
| `--subject <line>`        | One line stating what the workspace covers, required        |
| `--starting-point <text>` | What the learner already knows, required                    |
| `--success <line>`        | Observable thing the learner will be able to do, repeatable |
| `--out-of-scope <line>`   | What the workspace does not cover, repeatable               |
| `--title <text>`          | Title, defaulting to the topic in sentence case             |
| `--date <YYYY-MM-DD>`     | Opening date, defaulting to today                           |
| `--json`                  | Emit a machine-readable record on stdout                    |
| `--root <path>`           | Teach root, defaulting to the main worktree                 |

The ordinal comes from the highest already present, incremented, so the caller derives no name and composes no path. A topic another workspace already covers is refused rather than opened beside it, since two workspaces on one subject fork the learning records the folder exists to keep whole.

`--starting-point` is required rather than defaulted because difficulty with no floor under it teaches nobody, and a mission written without one cannot say what the lessons sit above. At least one `--success` line is required for the same reason in the other direction: a mission nothing can test is a mission nothing can call finished.

## Resource

`aitk teach resource` records sources in a workspace `RESOURCES.md`, keeping what was read apart from what was only found.

```bash
aitk teach resource regular-expressions \
  --read "MDN regular expressions=https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions" \
  --lead "RE2 syntax=https://github.com/google/re2/wiki/Syntax"
```

| Option               | Behavior                                           |
| -------------------- | -------------------------------------------------- |
| `--read <title=url>` | Source that stands behind the material, repeatable |
| `--lead <title=url>` | Source found and not opened, repeatable            |
| `--json`             | Emit a machine-readable record on stdout           |
| `--root <path>`      | Teach root, defaulting to the main worktree        |

The pair splits on the first `=`, so a URL carrying its own separator survives intact. Say in the title which claims rest on the source, since the entry is the only place a later session reads that from.

A URL either heading already lists is refused rather than written twice. Two entries for one source split what rests on it across two lines, and a reader checking a claim then finds half of the answer.

A URL a file displays inside a fence does not count as listed, which is how a workspace quoting the entry format in its own prose is read as the sample it is.

## Glossary

`aitk teach glossary` adds terms to a workspace `GLOSSARY.md`, alphabetically.

```bash
aitk teach glossary regular-expressions \
  --term "capture group=A parenthesised part of a pattern whose match is kept" \
  --first-seen 0002-groups.html
```

| Option                     | Behavior                                                  |
| -------------------------- | --------------------------------------------------------- |
| `--term <term=definition>` | Term the subject defines, repeatable                      |
| `--first-seen <file>`      | Lesson or reference page the batch first defines these in |
| `--json`                   | Emit a machine-readable record on stdout                  |
| `--root <path>`            | Teach root, defaulting to the main worktree               |

One call writes one file, which keeps a batch of terms from racing on the glossary every one of them shares. `--first-seen` names one page for the whole batch rather than one per term, because a batch comes from one lesson.

A term already defined is refused rather than replaced. A definition the subject has moved under is a revision of the entry that exists, and nothing on the command line tells that apart from a second definition arriving by mistake.

The entry lands as the standard's shape, leading with the term as a bolded span. A definition not ending in sentence punctuation is terminated before the citation is appended, so a bare phrase does not run into the sentence naming where the term first appears.

## Refusal reasons

| Reason         | Raised when                                                     |
| -------------- | --------------------------------------------------------------- |
| `no-teach`     | The root carries no `.claude/teach/` folder                     |
| `no-workspace` | No workspace matches the topic, with the folder names as detail |
| `ambiguous`    | Two workspaces claim one topic, with both names as detail       |
| `exists`       | A workspace already covers the topic an open names              |
| `no-file`      | The workspace carries no file the verb writes into              |
| `no-section`   | `RESOURCES.md` carries no heading the entries belong under      |
| `listed`       | A URL is already listed under either heading                    |
| `defined`      | A term already carries a glossary entry                         |
| `bad-input`    | The command line is malformed, before any folder is read        |

A `bad-input` refusal reports the working directory as its root rather than the resolved one, since the command line is rejected before the root is worth resolving.
