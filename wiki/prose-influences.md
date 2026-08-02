---
title: Prose influences
description: Industry style guides behind prose.md and AI-specific additions
---

# Prose influences

The rules in `.claude/standards/prose.md` draw from three industry style guides plus AI-specific additions. Source: Google, Microsoft, and Apple, whose guides are linked in the table below.

## Industry guides

| Guide                                      | What we adopted                                                                                           | Link                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Google Developer Documentation Style Guide | Active voice, present tense, no buzzwords, common words over complex alternatives, sentence case headings | [developers.google.com/style](https://developers.google.com/style)                                     |
| Microsoft Writing Style Guide              | Direct verbs, no filler openers, front-loaded paragraphs, scannable structure                             | [learn.microsoft.com/en-us/style-guide](https://learn.microsoft.com/en-us/style-guide/welcome/)        |
| Apple Style Guide                          | Code font for code, and `in order to` cut to `to`                                                         | [support.apple.com/guide/applestyleguide](https://support.apple.com/guide/applestyleguide/welcome/web) |

These guides overlap heavily on core principles. Our rules take the subset of that overlap that survives in terse reference prose, and leave two shared principles to the standards governing the surfaces where they apply.

The Apple row is narrower than the other two because the guide is a different kind of document. Google and Microsoft each state voice principles on a single page. Apple's guide is a terminology and mechanics reference whose six chapters name no voice or tone chapter, so what it contributes is per-term rulings rather than principles.

The row's two claims come from [`Use code font for code`](https://support.apple.com/guide/applestyleguide/code-apsg1fde748e/web) under `Technical notation` and the [`in order to` entry](https://support.apple.com/guide/applestyleguide/i-apsg346ef241/web), which sends the reader to _to_. Read 2026-08-02 against `fcfb9787`, covering the welcome page, `About the guide`, the `Writing inclusively` and `Technical notation` chapters, and the [D](https://support.apple.com/guide/applestyleguide/d-apsg7af4f5d0/web), [E](https://support.apple.com/guide/applestyleguide/e-apsg076a7313/web), [I](https://support.apple.com/guide/applestyleguide/i-apsg346ef241/web), [J](https://support.apple.com/guide/applestyleguide/j-apsgf88bd162/web), [S](https://support.apple.com/guide/applestyleguide/s-apsge70df12b/web), [U](https://support.apple.com/guide/applestyleguide/u-apsg45c3b57e/web), and [V](https://support.apple.com/guide/applestyleguide/v-apsg51b3c806/web) pages of `Style and usage A–Z`.

## AI-specific additions

These patterns are not covered by the industry guides. They target habits common in LLM-generated text. `in order to` is absent from the list because the Apple guide rules on it directly, which is why it sits in the row above instead.

- Negative parallelism (`It's not X, it's Y`)
- Gerund openers (`Leveraging the API...`)
- Hedging clusters (`It might be worth considering`)
- False balance (`While X is true, Y is also important`)
- Participant address (`Let's`, `Here's`, `Here are`)
- Padded verb phrases (`ensure that X is set`, `By doing X, you can Y`)
- Em dash and semicolon overuse
- Parenthetical asides in prose
- List lead-ins (`Here are the X:`, `The following X:`)

## Positive guidance

The bans above subtract slop. They also push output toward a uniform staccato cadence, so prose.md pairs them with construction guidance: vary sentence length and opening structure, use substantive connectives where flow matters, and never pad for rhythm. This guidance is soft judgment, not a fixed pattern, so the standards audit does not score it mechanically.

## What we left out

Three principles these guides state did not reach `prose.md`, and none is a disagreement.

Google's [guidance on person](https://developers.google.com/style/person) says to address the reader as _you_ rather than _we_, and permits first-person plural where the authoring organization is a clear antecedent. `prose.md` takes no position on person at all.

Microsoft states [three voice principles](https://learn.microsoft.com/en-us/style-guide/brand-voice-above-all-simple-human), "Warm and relaxed", "Crisp and clear", and "Ready to lend a hand". Only the middle one reached `prose.md`, whose opening voice bullet is close to a paraphrase of it. The same page names contractions under its "Talk like a person" style tip.

Both address a reader that terse reference prose does not serve, and both land in the `## Voice` section of `standards/readme.md` instead, scoped to the README at a repository root. The guides were adopted by surface rather than in full.

Apple devotes a [chapter to writing inclusively](https://support.apple.com/guide/applestyleguide/intro-to-inclusive-writing-apdcb2a65d68/web) covering gender identity, disability, and representation, on the stated principle that "The people who use Apple products reflect the diversity of the world at large." No standard in the repository takes a position on it.

## Where we diverge

- The industry guides allow semicolons and em dashes with moderation. We ban both outright because AI models overuse them consistently.
- Google's guide permits "Note that" in specific contexts. We ban it entirely.
- Apple's [`jargon` entry](https://support.apple.com/guide/applestyleguide/j-apsgf88bd162/web) says to avoid jargon whenever possible and define technical terminology on first occurrence. `prose.md` assumes developer-level technical knowledge and skips hand-holding explanations, which reverses the entry for reference docs written for developers.
- None of the industry guides address negative parallelism or hedging clusters since these patterns predate widespread LLM usage in docs.
