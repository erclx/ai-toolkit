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
| Apple Style Guide                          | Concise phrasing, no vague qualifiers, developer-level assumptions                                        | [support.apple.com/guide/applestyleguide](https://support.apple.com/guide/applestyleguide/welcome/web) |

These guides overlap heavily on core principles. Our rules take the subset of that overlap that survives in terse reference prose, and leave two shared principles to the standards governing the surfaces where they apply.

## AI-specific additions

These patterns are not covered by the industry guides. They target habits common in LLM-generated text.

- Negative parallelism (`It's not X, it's Y`)
- Gerund openers (`Leveraging the API...`)
- Hedging clusters (`It might be worth considering`)
- False balance (`While X is true, Y is also important`)
- Participant address (`Let's`, `Here's`, `Here are`)
- Padded verb phrases (`in order to`, `ensure that`)
- Em dash and semicolon overuse
- Parenthetical asides in prose
- List lead-ins (`Here are the X:`, `The following X:`)

## Positive guidance

The bans above subtract slop. They also push output toward a uniform staccato cadence, so prose.md pairs them with construction guidance: vary sentence length and opening structure, use substantive connectives where flow matters, and never pad for rhythm. This guidance is soft judgment, not a fixed pattern, so the standards audit does not score it mechanically.

## What we left out

Two principles these guides state did not reach `prose.md`, and neither is a disagreement. Both address a reader that terse reference prose does not serve.

Google's [guidance on person](https://developers.google.com/style/person) says to address the reader as _you_ rather than _we_, and permits first-person plural where the authoring organization is a clear antecedent. `prose.md` takes no position on person at all.

Microsoft states [three voice principles](https://learn.microsoft.com/en-us/style-guide/brand-voice-above-all-simple-human), "Warm and relaxed", "Crisp and clear", and "Ready to lend a hand". Only the middle one reached `prose.md`, whose opening voice bullet is close to a paraphrase of it. The same page names contractions under its "Talk like a person" style tip.

Both land in `standards/readme.md` instead. Its `## Voice` section requires second person, permits contractions, and asks for a point of view and honesty about limits, all scoped to the README at a repository root. The guides were adopted by surface rather than in full.

## Where we diverge

- The industry guides allow semicolons and em dashes with moderation. We ban both outright because AI models overuse them consistently.
- Google's guide permits "Note that" in specific contexts. We ban it entirely.
- None of the industry guides address negative parallelism or hedging clusters since these patterns predate widespread LLM usage in docs.
