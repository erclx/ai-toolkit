---
title: Lesson craft reference
description: Typography, restraint, quiz construction, and what makes a lesson worth returning to
---

# Lesson craft reference

Judgment rather than shape. The workspace standard fixes where a lesson sits and what it is named, and this file covers what makes one worth opening twice.

## One course, not a pile of pages

A workspace accumulates lessons over weeks. The learner reads them as one body of material, so a lesson that invents its own look reads as someone else's work.

- Write the shared stylesheet into the workspace assets on the first lesson, and link it from every lesson after
- Promote anything used a second time into that stylesheet. A second use makes it a component of the course.
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

## Quiz construction

The quiz is the retrieval, so a leak in its construction turns it into a reading test.

- Write every option to the same length, in words and in characters. A longer option reads as the considered one.
- Vary which position holds the correct answer, and never let the order follow the order the material was taught in
- Make each wrong option a misconception someone actually holds. An obviously wrong option removes itself and shrinks the question.
- Write feedback for every option, including the correct one, saying why rather than whether
- Give feedback after the attempt, never alongside the question

## What makes a lesson worth returning to

- The worked example is complete. A learner returning for the example finds the whole thing rather than a fragment they have to reconstruct.
- The lesson states what it assumes. A returning reader can tell in one line whether they are in the right place.
- The hard part is named as the hard part. Material that flattens everything to one difficulty gives a returning reader nothing to navigate by.
- Nothing depends on the session it was written in. A lesson referring to what was discussed is unreadable a week later.
