# Prose reference

## Voice

- Write for a developer who is scanning, not studying. Every sentence should be understandable on first read without re-reading.
- Use active voice and present tense for all content
- Prioritize direct verbs and nouns, using the absolute minimum words necessary
- Use common words over complex alternatives (`use` not `utilize`, `help` not `facilitate`)
- Prefer `is`/`has` over inflated alternatives (`serves as`, `features`, `offers`, `provides`)
- Vary sentence length; mix short declarative sentences with longer compound ones to break uniform cadence
- Match certainty to the claim; be direct on established facts, hedge on genuinely uncertain areas
- Assume developer-level technical knowledge; skip hand-holding explanations

## Structure

- H1 for document title, H2 for main sections, H3 for subsections
- Use sentence case for all headings, including H1, H2, and H3 (proper nouns and product names retain their casing)
- Front-load key information in each paragraph; keep paragraphs concise and scannable
- Every sentence must provide new information; remove redundant context
- Use prose by default; reserve bullets for discrete, unrelated items

## Formatting

- Use dashes (`-`) not asterisks (`*`) for bulleted lists
- Wrap commands, API names, file paths, and code identifiers in backticks
- Use a language identifier on all fenced code blocks (`markdown`, `typescript`, `plaintext`); never use a bare ` ``` `
- In ASCII tree diagrams, use `←` for inline annotations; never use `#`
- For key path lists, use colon format: `- \`src/\`: description`; never use an em dash
- Do not over-format with excessive bold, italic, or header usage
- Do not use horizontal rules or dividers (`---`)
- Do not use em dashes (`—`); use a comma, period, or restructure the sentence instead
- Use descriptive anchor text for links; avoid `click here` or `read more`

## Language

- Do not use marketing buzzwords (`seamless`, `robust`, `powerful`, `revolutionary`, `enhanced`, `allows`)
- Do not use vague qualifiers (`simply`, `just`, `easily`, `quickly`, `very`, `really`)
- Do not start sentences with filler (`Note that`, `Basically`, `Essentially`, `It should be noted`)
- Do not use connective filler (`That being said`, `With that in mind`, `As mentioned earlier`, `It's worth noting`)
- Do not use the negative parallelism pattern (`It's not X, it's Y`, `not because X, but because Y`)
- Do not open sentences with gerund phrases (`Leveraging the API...`, `Building on this...`, `Utilizing the config...`)
- Do not use diplomatic false balance in technical docs (`While X is true, Y is also important`); state the recommendation directly
- Do not write in overly academic or corporate language

## Examples

### Correct

```markdown
Run `npm install` to install dependencies. The build process uses Vite for faster compilation. # active voice + direct verb

Configuration lives in `vite.config.ts`. Modify the `plugins` array to add build extensions. # front-loaded + backticks

Use the `retry` option for failed webhooks. Set `maxRetries` to 3. Most production systems need no more than that. # varied sentence length + direct recommendation

The cache is an LRU store. It evicts the least-recently-used entry when full, which keeps memory bounded without manual cleanup. # `is` not `serves as` + clear on established fact

Key features:

- Hot module replacement during development # plain dash + no bold
- Tree-shaking for production builds
- TypeScript support without additional setup
```

### Incorrect

```markdown
Basically, you'll want to simply run `npm install` to easily install all of the dependencies. # filler opener + vague qualifiers
Note that the build process utilizes the powerful and robust Vite bundler, which allows for seamless faster compilation. # "Note that" + buzzwords + "utilize"

It's not just a cache. It's a system for intelligent memory management. # negative parallelism + inflated language
Leveraging the retry mechanism, developers can build more resilient webhook integrations. # gerund opener + vague
While the retry option is useful, error handling is also important. # false balance instead of a recommendation
That being said, the `plugins` array offers a flexible interface for extending the build pipeline. # connective filler + "offers"

**Key features:**

- **Seamless** hot module replacement during development # excessive bold + buzzword
- **Powerful** tree-shaking for production builds # buzzword
- **Enhanced** TypeScript support without additional setup # buzzword
```
