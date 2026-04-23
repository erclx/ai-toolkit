---
name: aitk-ask
description: Answers repository-knowledge questions about this toolkit by looking up `docs/index.md` and `wiki/index.md` first, then the specific file those indexes point to. Use when asked "how do I use X", "what does Y do", "where is Z documented", or "how do I set up a target project". Do NOT use for code changes, editing, debugging, or questions about external tools not documented in this repo.
disable-model-invocation: true
---

# Aitk ask

Manual Q&A surface for toolkit self-knowledge. User triggers with `/aitk-ask <question>`. Output is short, cites the source file, and stops.

## Guards

- If no question is provided, stop: `❌ No question. Ask something like "how do I set up a target project".`
- Do not modify any file. This skill is read-only.
- Do not open `src/`, `scripts/`, or any source file. Prose surfaces only.

## Step 1: read both indexes in parallel

From the project root, read these together:

- `docs/index.md`: one-line summary per domain reference
- `wiki/index.md`: one-line summary per tool and concept reference

Both indexes are small. Parallel read avoids routing errors between domain references and wiki prose.

## Step 2: pick one file

Match the question against the one-line summaries in both indexes. Pick the single most relevant file. Prefer `docs/` for domain structure, CLI surface, and target-project integration. Prefer `wiki/` for Claude Code concepts, tool reference, and workflow prose.

If two entries look equally relevant, read both. Do not read more than two.

## Step 3: answer

Read the picked file. Answer the question in four lines or fewer. End with a `Source:` line naming the file paths used.

Response format:

```plaintext
<answer, four lines or fewer>

Source: <relative/path/to/file.md>
```

When two files were read, list both on the `Source:` line separated by a comma.

## Step 4: escalation

When neither index points at a relevant file, fall through in this order:

1. `CLAUDE.md` for behavior rules and conventions
2. `.claude/REQUIREMENTS.md` for scope and non-goals
3. `standards/*.md` for authoring conventions
4. `governance/rules/` and `governance/stacks/` for rule content

Stop at the first file that answers the question. If none do, reply:

```plaintext
Not covered in docs or wiki. Narrow the question or point at a specific file.
```

Do not guess. Do not read source files. Do not grep the whole repo.

## Tone

- Direct. Developer-level technical knowledge assumed.
- No marketing words, no hedging clusters, no filler lead-ins.
- Follow `standards/prose.md` for any multi-line answer.
- Prose by default. Use bullets only when the answer is a discrete list already present in the source file.

## Do not

- Do not implement, edit, or run commands the answer describes.
- Do not paraphrase large sections. Quote one short phrase if useful and cite the file.
- Do not chain multiple follow-up file reads past Step 2 + Step 4. One hop per escalation level.
