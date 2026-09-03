---
title: Lesson craft reference
description: Typography, restraint, quiz construction, and what makes a lesson worth returning to
---

# Lesson craft reference

Judgment rather than shape. The workspace standard fixes where a lesson sits and what it is named, and this file covers what makes one worth opening twice.

## One course, not a pile of pages

A workspace accumulates lessons over weeks. The learner reads them as one body of material, so a lesson that invents its own look reads as someone else's work.

- Write the shared stylesheet into the workspace assets on the first lesson, and embed it in every lesson after
- Promote anything used a second time into that stylesheet. A second use makes it a component of the course.
- Add to that stylesheet rather than replacing it. The lesson writing it is rarely the lesson that needs it changed, and a rewrite drops what every earlier lesson embeds it for.
- Keep the structural furniture identical across lessons: where the title sits, where the quiz sits, what a correct answer looks like
- Do not restate styles inside a lesson. A local override is a decision the next lesson has to either copy or contradict.

## Typography

The learner is reading, so the reading surface is the product.

- Set body text at a comfortable reading size with generous line height, and hold the measure to roughly 65 to 75 characters
- Use one typeface for prose and one for code, and no others
- Build hierarchy from size and weight rather than from color. Color that carries meaning fails for a reader who cannot see it.
- Give code blocks room. Cramped code is the part of a lesson a learner skips.

## Restraint

Every element competes with the material for attention.

- Cut any decoration that carries no information
- Use at most one accent color, reserved for the thing the learner acts on
- Do not animate anything the learner did not trigger
- Prefer whitespace over rules and boxes to separate sections

## Diagrams

A diagram earns its place when a relationship, a boundary, a path, a before-and-after, is the point of the passage rather than decoration for it. Most passages do not clear that bar, and a lesson reaching for a diagram on every section is the failure the neighboring `## Restraint` section already guards against. When prose or a list already carries that point, leave it there.

- Wrap it in a `<figure>` holding an inline `<svg>` and a `<figcaption>` that names what to take from the diagram rather than what it shows. Let the figure run wider than the prose column, since a diagram cramped to the reading measure loses the labels it needs.
- Draw it by hand, as plain shapes and lines authored directly in the markup, not exported from a diagramming tool.
- Color every fill and stroke through a custom property the workspace's own stylesheet defines, never a literal hex value, which is the same rule that stylesheet's opening comment already states for every rule added under it. The diagram then re-colors itself on the same switch that re-colors the page.
- Give the `<svg>` an accessible name: `role="img"` with `aria-label` for one short line, or `aria-labelledby` pointing at a `<title>` element inside it for a longer one.

## Quiz construction

The quiz is the retrieval, so a leak in its construction turns it into a reading test.

- Write every option to the same length, in words and in characters. A longer option reads as the considered one.
- Write the correct option first and let the ordering verb place it. Position is not the author's to pick: an author who varies it by hand still varies it by judgment, and the judgment settles on the first slot.
- Make each wrong option a misconception someone actually holds. An obviously wrong option removes itself and shrinks the question.
- Write feedback for every option, including the correct one, saying why rather than whether
- Give feedback after the attempt, never alongside the question

## Tokens travel with the course

A lesson carries its own values in the shared stylesheet rather than reading a host project's. A workspace runs in any project and most carry no token record at all, so a lesson inheriting one is a lesson that renders unstyled wherever the record is absent, with nothing reporting it.

Pick values the material needs rather than values the project happens to hold. Inheriting is worth offering as something a learner asks for once, and it is the wrong default in every project that cannot answer.

## What makes a lesson worth returning to

- The worked example is complete. A learner returning for the example finds the whole thing rather than a fragment they have to reconstruct.
- The lesson states what it assumes. A returning reader can tell in one line whether they are in the right place.
- The hard part is named as the hard part. Material that flattens everything to one difficulty gives a returning reader nothing to navigate by.
- Nothing depends on the session it was written in. A lesson referring to what was discussed is unreadable a week later.
