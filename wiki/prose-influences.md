# Prose influences

The rules in `standards/prose.md` draw from three industry style guides plus AI-specific additions.

## Industry guides

| Guide                                      | What we adopted                                                                                           | Link                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Google Developer Documentation Style Guide | Active voice, present tense, no buzzwords, common words over complex alternatives, sentence case headings | [developers.google.com/style](https://developers.google.com/style)                                     |
| Microsoft Writing Style Guide              | Direct verbs, no filler openers, front-loaded paragraphs, scannable structure                             | [learn.microsoft.com/en-us/style-guide](https://learn.microsoft.com/en-us/style-guide/welcome/)        |
| Apple Style Guide                          | Concise phrasing, no vague qualifiers, developer-level assumptions                                        | [support.apple.com/guide/applestyleguide](https://support.apple.com/guide/applestyleguide/welcome/web) |

These guides overlap heavily on core principles. Our rules compress the shared consensus into a single reference.

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

## Where we diverge

- The industry guides allow semicolons and em dashes with moderation. We ban both outright because AI models overuse them consistently.
- Google's guide permits "Note that" in specific contexts. We ban it entirely.
- None of the industry guides address negative parallelism or hedging clusters since these patterns predate widespread LLM usage in docs.
