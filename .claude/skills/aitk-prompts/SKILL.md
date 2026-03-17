---
name: aitk-prompts
description: System prompt templates for AI authoring. Use for adding prompts, editing role templates, or prompt conventions.
---

# Prompts

## Structure

- All-caps H1 title (`# BASH SCRIPT ARCHITECT`), all-caps H2 sections (`## ROLE`, `## CRITICAL CONSTRAINTS`), title case H3 subsections (`### Must Do`).
- Every prompt must include `## ROLE`, `## CRITICAL CONSTRAINTS`, `## OUTPUT FORMAT`.
- Add `## VALIDATION` when the output involves multi-step logic or edge cases. Omit for simple single-purpose prompts.

## Content

- Prompts are machine-readable specs. Optimize for token efficiency and deterministic output, not prose readability.
- Every constraint must be verifiable from the output. No subjective qualifiers like "appropriate" or "well-structured".
- Do not duplicate general LLM knowledge. Focus on project-specific constraints and output shape.
- Use imperative voice throughout. "Do X", never "You should" or "Try to".

## Full reference

- `docs/prompts.md`: system overview, heading conventions, required sections
- `prompts/meta-prompt.md`: system prompt generator template, output format, constraint patterns
