# MARKDOWN WRITING REFERENCE

## RULES

- Voice: Use active voice and present tense for all content.
- Directness: Prioritize direct verbs and nouns, phrasing all content using the absolute minimum number of words necessary.
- Bullets: Use dashes (-) not asterisks (*) for all bulleted lists.
- Technical Terms: Wrap commands, API names, file paths, and code identifiers in backticks.
- Lists: Use prose by default; reserve bullets for discrete, unrelated items.
- Clarity: Use common words over complex alternatives (prefer "use" over "utilize", "help" over "facilitate").
- Audience: Assume developer-level technical knowledge; skip hand-holding explanations.
- Density: Every sentence must provide new information; remove redundant context.
- Structure: Front-load key information in each paragraph; keep paragraphs concise and scannable.

## CONSTRAINTS

- Do not use marketing buzzwords: "seamless," "robust," "game-changer," "powerful," "revolutionary," "enhanced," "allows."
- Do not use vague qualifiers: "simply," "just," "easily," "quickly," "very," "really."
- Do not start sentences with filler: "Note that," "It should be noted," "Basically," "Essentially."
- Do not over-format with excessive bold, italic, or header usage.
- Do not explain obvious concepts or provide unnecessary context.
- Do not use unnecessary adverbs or qualifiers.
- Do not write in overly academic or corporate language.

## EXAMPLES

### Correct

Run `npm install` to install dependencies. The build process uses Vite for faster compilation.

Configuration lives in `vite.config.ts`. Modify the `plugins` array to add build extensions.

Key features:
- Hot module replacement during development
- Tree-shaking for production builds
- TypeScript support without additional setup

### Incorrect

Basically, you'll want to simply run `npm install` to easily install all of the dependencies. Note that the build process utilizes the powerful and robust Vite bundler, which allows for seamless and revolutionary faster compilation.

It should be noted that configuration lives in `vite.config.ts`. You can very easily modify the `plugins` array to quickly add build extensions.

**Key features:**
- **Seamless** hot module replacement during development
- **Powerful** tree-shaking for production builds
- **Enhanced** TypeScript support without additional setup