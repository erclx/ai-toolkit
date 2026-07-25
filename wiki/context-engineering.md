---
title: Context engineering
description: Claude 5 context-engineering principles and how they map to the toolkit's tiers, skills, and references
---

# Context engineering

Context engineering is the practice of assembling everything Claude sees on a request beyond the prompt: the system prompt, `CLAUDE.md`, skills, memory, and references. Anthropic published guidance on how this shifts for the Claude 5 generation of models. This page distills the principles and maps them to the toolkit. Source: [The new rules of context engineering for Claude 5 models](https://x.com/trq212/article/2080710971228918066).

## The core shift

Newer models need far less hand-holding. Anthropic removed over 80 percent of Claude Code's system prompt for the Claude 5 generation with no measurable loss on coding evaluations. Older models needed strong, sometimes overly broad rules to avoid worst-case behavior. Claude 5 models read surrounding context and apply judgment, so many of those rules now over-constrain and force the model to adjudicate conflicting instructions before it can work.

## What changed

Each shift replaces a rule-heavy habit with a judgment-friendly one.

- Rules to judgment. Replace a blanket prohibition with a principle the model can apply. Instead of "never write comments", say "match the surrounding code's comment density".
- Examples to interfaces. Examples narrow the model's exploration. Design expressive tool parameters and file shapes instead, and let the interface imply correct use.
- Upfront to progressive disclosure. Do not front-load every instruction. Load the right context at the right time through a tree of files the model reads on demand.
- Repetition to simple descriptions. State a tool's usage once, in the tool description, not repeated across the system prompt.
- Manual memory to auto-memory. Claude now saves relevant memories on its own rather than relying on hand-written notes in `CLAUDE.md`.
- Simple specs to rich references. A reference can be code, a test suite, a rubric, or an HTML artifact, not only a markdown spec. High-fidelity references in a language the model knows well beat prose descriptions.

## Assembling each surface

- System prompt. Tied to the product. For a custom agent this is where most of the effort belongs. For Claude Code you rarely touch it.
- `CLAUDE.md`. Keep it lightweight. Briefly say what the repo is for, then spend the tokens on non-obvious gotchas. Skip anything the model can infer from the file system. Push detail into a skill referenced from `CLAUDE.md`.
- Skills. Treat a skill as a lightweight guide that helps the model find information when needed. Avoid over-constraining except in genuinely high-stakes areas. Split a long skill into many files and disclose them progressively.
- References. Prefer files in code. A reference the model reads in a language it knows well gives clearer instruction than a description or a screenshot.

## How it maps to the toolkit

The guidance validates most of the toolkit's architecture and cautions on a few surfaces.

- Progressive disclosure is the three-tier context model. `CLAUDE.md` always loads, `.claude/rules/` load by path scope, and `.claude/context/` loads on demand through `index.md`. This is the tree-of-files pattern the guidance recommends.
- Rich references cover the sandbox scenarios and code fixtures. A seeded scenario is a higher-fidelity reference than a prose description of expected behavior.
- Lightweight `CLAUDE.md` reframes the minimal-seed goal. The aim is to cut what the model can infer and keep the non-obvious gotchas, not to relocate every rule.
- The cautions land on rule density. The governance rules encode legitimate engineering opinions, but a skill that over-specifies, or a `CLAUDE.md` section that states the obvious, is a candidate to trim.
- The `/doctor` command in Claude Code rightsizes `CLAUDE.md` and skills automatically and is worth running before a manual audit.
