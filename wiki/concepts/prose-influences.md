---
title: Prose influences
description: Industry style guides behind markdown.md and the write-human skill, plus AI-specific additions
---

# Prose influences

The rules in `standards/markdown.md` and the `write-human` skill draw from three industry style guides plus AI-specific additions. The standard holds word choice, punctuation, and formatting, and the skill holds voice and cadence, so a rule below is attributed to whichever carrier states it. Source: Google, Microsoft, and Apple, whose guides are linked in the table below.

## Industry guides

| Guide                                      | What we adopted                                                                                                                                                 | Link                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Google Developer Documentation Style Guide | Active voice, present tense, no buzzwords, common words over complex alternatives, sentence case headings, no first person or `let's`, varied sentence openings | [developers.google.com/style](https://developers.google.com/style)                                     |
| Microsoft Writing Style Guide              | Direct verbs, the shortest verb phrase, no filler openers, no first-person plural, front-loaded paragraphs, scannable structure                                 | [learn.microsoft.com/en-us/style-guide](https://learn.microsoft.com/en-us/style-guide/welcome/)        |
| Apple Style Guide                          | Code font for code, no first person, and `in order to` cut to `to`                                                                                              | [support.apple.com/guide/applestyleguide](https://support.apple.com/guide/applestyleguide/welcome/web) |

These guides overlap heavily on core principles. Our rules take the subset of that overlap that survives in terse reference prose, and leave two shared principles to the standards governing the surfaces where they apply.

The Apple row is narrower than the other two because the guide is a different kind of document. Google and Microsoft each state voice principles on a single page. Apple's guide is a terminology and mechanics reference whose six chapters name no voice or tone chapter, so what it contributes is per-term rulings rather than principles.

The row's three claims come from [`Use code font for code`](https://support.apple.com/guide/applestyleguide/code-apsg1fde748e/web) under `Technical notation`, the [`in order to` entry](https://support.apple.com/guide/applestyleguide/i-apsg346ef241/web), which sends the reader to _to_, and the [`we` entry](https://support.apple.com/guide/applestyleguide/w-apsg48ccd3b3/web), which reads `Don't use first person` and sends the writer to the reader or the product instead.

Read 2026-08-02 against `fcfb9787`, covering the welcome page, `About the guide`, the `Writing inclusively` and `Technical notation` chapters, and the [D](https://support.apple.com/guide/applestyleguide/d-apsg7af4f5d0/web), [E](https://support.apple.com/guide/applestyleguide/e-apsg076a7313/web), [I](https://support.apple.com/guide/applestyleguide/i-apsg346ef241/web), [J](https://support.apple.com/guide/applestyleguide/j-apsgf88bd162/web), [S](https://support.apple.com/guide/applestyleguide/s-apsge70df12b/web), [U](https://support.apple.com/guide/applestyleguide/u-apsg45c3b57e/web), and [V](https://support.apple.com/guide/applestyleguide/v-apsg51b3c806/web) pages of `Style and usage A–Z`. The [G](https://support.apple.com/guide/applestyleguide/g-apsg4104680a/web), [H](https://support.apple.com/guide/applestyleguide/h-apsg9dac5903/web), [L](https://support.apple.com/guide/applestyleguide/l-apsg087a9dba/web), [P](https://support.apple.com/guide/applestyleguide/p-apsg4473eab0/web), and [W](https://support.apple.com/guide/applestyleguide/w-apsg48ccd3b3/web) pages were added 2026-08-02 against `a37d18a2` by the sweep the rest of this page records.

The Google and Microsoft rows were checked the same day against `a37d18a2`. Google's entries rest on [Voice and tone](https://developers.google.com/style/tone), which lists `Phrasing in terms of let's do something` and `Starting all sentences with the same phrase` under things to avoid, on [Pronouns](https://developers.google.com/style/pronouns), which reads `Avoid first-person pronouns`, and on the [word list](https://developers.google.com/style/word-list) entries for `let's`, `in order to`, and `just`. Microsoft's rest on [Use simple words, concise sentences](https://learn.microsoft.com/en-us/style-guide/word-choice/use-simple-words-concise-sentences), which reads `Don't use two or three words when one will do` and pairs `to` against `in order to`, and on [Person](https://learn.microsoft.com/en-us/style-guide/grammar/person), whose heading reads `Avoid plural first person (we, us)`.

All three guides rule on the first-person half of participant address and none of them mentions `Here's` or `Here are`, so that half of the ban is the toolkit's own.

## AI-specific additions

These four bans are the toolkit's own. They target habits common in LLM-generated text rather than anything the industry guides set out to fix. This section makes no claim about guide coverage, because every such claim on this page now sits under `Where we diverge` or `What we left out`, next to the page it rests on.

- Negative parallelism (`It's not X, it's Y`)
- Gerund openers (`Leveraging the API...`)
- Hedging clusters (`It might be worth considering`)
- False balance (`While X is true, Y is also important`)

Five patterns left this list on 2026-08-02. Participant address and padded verb phrases moved to the rows above, because all three guides rule on them. Em dash and semicolon overuse, parenthetical asides, and list lead-ins moved to `Where we diverge`, because the guides permit what `markdown.md` bans. `in order to` left earlier in `#711` for the same reason as the first pair.

## Positive guidance

The bans above subtract slop. They also push output toward a uniform staccato cadence, so the `write-human` skill pairs them with construction guidance: vary sentence length and opening structure, use substantive connectives where flow matters, and never pad for rhythm. This guidance is soft judgment rather than a fixed pattern, so the standards audit does not score it mechanically.

The cadence half is Google's. [Voice and tone](https://developers.google.com/style/tone) names `Starting all sentences with the same phrase (such as You can or To do)` and `Choppy or long-winded sentences` under things to avoid, and the same page reads `Use transitions between sentences. Phrases like Though or This way can make paragraphs less stilted.` The no-padding half is Microsoft's, from [Use simple words, concise sentences](https://learn.microsoft.com/en-us/style-guide/word-choice/use-simple-words-concise-sentences), which reads `remove words that don't add substance`. Both read 2026-08-02 against `a37d18a2`.

## What we left out

Four principles these guides state did not reach either carrier, and none is a disagreement.

Google's [guidance on person](https://developers.google.com/style/person) says to address the reader as _you_ rather than _we_, and permits first-person plural where the authoring organization is a clear antecedent. Neither carrier takes a position on person at all.

Microsoft states [three voice principles](https://learn.microsoft.com/en-us/style-guide/brand-voice-above-all-simple-human), "Warm and relaxed", "Crisp and clear", and "Ready to lend a hand". Only the middle one was adopted, and the skill's opening voice bullet is close to a paraphrase of it. The same page names contractions under its "Talk like a person" style tip.

Both address a reader that terse reference prose does not serve, and both land in the `## Voice` section of `standards/readme.md` instead, scoped to the README at a repository root. The guides were adopted by surface rather than in full.

Apple devotes a [chapter to writing inclusively](https://support.apple.com/guide/applestyleguide/intro-to-inclusive-writing-apdcb2a65d68/web) covering gender identity, disability, and representation, on the stated principle that "The people who use Apple products reflect the diversity of the world at large." No standard in the repository takes a position on it.

Apple's [`while, although, whereas` entry](https://support.apple.com/guide/applestyleguide/w-apsg48ccd3b3/web) reads `While means during the time that and implies concurrent activities` and sends contrast to _although_. `markdown.md` bans the false balance that `While X is true, Y is also important` carries but takes no position on the connective itself, so a sentence can clear the ban and still misuse `while` by Apple's rule. Read 2026-08-02 against `a37d18a2`. The three entries above it predate the citation convention `#711` introduced and carry no date.

## Where we diverge

Every entry names the page it rests on. Claims added or re-checked on 2026-08-02 are dated against `a37d18a2`.

### Semicolons and em dashes

The industry guides allow both with moderation. We ban them outright because AI models overuse them consistently.

Google's [semicolons page](https://developers.google.com/style/semicolons) reads `If possible, avoid using semicolons. In a few cases, a semicolon is preferred`, Microsoft's [semicolons page](https://learn.microsoft.com/en-us/style-guide/punctuation/semicolons) sets out three cases where one applies, and Microsoft's [dashes page](https://learn.microsoft.com/en-us/style-guide/punctuation/dashes-hyphens/) reads `Em dashes can be an effective alternative to colons, semicolons, and parentheses, but don't overuse them`. Checked 2026-08-02.

### The "Note that" opener

Google's guide permits "Note that" in specific contexts. We ban it entirely.

### Jargon and audience

Apple's [`jargon` entry](https://support.apple.com/guide/applestyleguide/j-apsgf88bd162/web) says to avoid jargon whenever possible and define technical terminology on first occurrence. The `write-human` skill assumes developer-level technical knowledge and skips hand-holding explanations, which reverses the entry for reference docs written for developers.

### Parenthetical asides

Google discourages them without banning them. Its [parentheses page](https://developers.google.com/style/parentheses) reads `don't put important information in parentheses if you can help it` and `whenever you're inclined to use parentheses, consider whether they're necessary`, where `markdown.md` bans the aside in prose outright.

Microsoft treats parentheses only as a [formatting](https://learn.microsoft.com/en-us/style-guide/punctuation/formatting-punctuation) question and Apple's `parenthesis` entry rules only on spelling, so neither addresses the aside. Checked 2026-08-02.

### List lead-ins

Google permits `the following` as a list lead-in and `markdown.md` bans that exact form. Google's [lists page](https://developers.google.com/style/lists) reads `In most cases, precede a list with an introductory sentence` and names `the following` as a noun phrase that can do it. The ban covers the two filler forms, `Here are the X:` and `The following X:`, and takes no position on a substantive introduction, so the divergence is over the wording rather than over the lead-in.

Microsoft's [lists page](https://learn.microsoft.com/en-us/style-guide/scannable-content/lists) and Apple's `lists (bulleted)` entry each require an introduction without naming a form, which `markdown.md` permits. Checked 2026-08-02.

### Patterns the guides predate

None of the three guides addresses negative parallelism, gerund openers, hedging clusters, or false balance as a pattern, since all four predate widespread LLM usage in docs.

Checked 2026-08-02 across Google's [Voice and tone](https://developers.google.com/style/tone), [Active voice](https://developers.google.com/style/voice), [Sentence structure](https://developers.google.com/style/sentence-structure), [Pronouns](https://developers.google.com/style/pronouns), and [word list](https://developers.google.com/style/word-list), Microsoft's [Verbs](https://learn.microsoft.com/en-us/style-guide/grammar/verbs), [Word choice](https://learn.microsoft.com/en-us/style-guide/word-choice/), [Use simple words, concise sentences](https://learn.microsoft.com/en-us/style-guide/word-choice/use-simple-words-concise-sentences), [Person](https://learn.microsoft.com/en-us/style-guide/grammar/person), and [Nouns and pronouns](https://learn.microsoft.com/en-us/style-guide/grammar/nouns-pronouns), and the G, H, L, P, and W pages of Apple's `Style and usage A–Z` linked above. Apple rules on the connective in `While X is true`, which is under `What we left out`.
