# PROSE REFERENCE

## Voice

- Use active voice and present tense for all content
- Prioritize direct verbs and nouns, using the absolute minimum words necessary
- Use common words over complex alternatives (`use` not `utilize`, `help` not `facilitate`)
- Assume developer-level technical knowledge; skip hand-holding explanations

## Structure

- H1 for document title, H2 for main sections, H3 for subsections
- Front-load key information in each paragraph; keep paragraphs concise and scannable
- Every sentence must provide new information; remove redundant context
- Use prose by default; reserve bullets for discrete, unrelated items

## Formatting

- Use dashes (`-`) not asterisks (`*`) for bulleted lists
- Wrap commands, API names, file paths, and code identifiers in backticks
- Do not over-format with excessive bold, italic, or header usage
- Do not use horizontal rules or dividers (`---`)
- Use descriptive anchor text for links; avoid `click here` or `read more`

## Language

- Do not use marketing buzzwords (`seamless`, `robust`, `powerful`, `revolutionary`, `enhanced`, `allows`)
- Do not use vague qualifiers (`simply`, `just`, `easily`, `quickly`, `very`, `really`)
- Do not start sentences with filler (`Note that`, `Basically`, `Essentially`, `It should be noted`)
- Do not write in overly academic or corporate language

## EXAMPLES

### Correct

```markdown
Run `npm install` to install dependencies. The build process uses Vite for faster compilation. # active voice + direct verb

Configuration lives in `vite.config.ts`. Modify the `plugins` array to add build extensions. # front-loaded + backticks

Key features:

- Hot module replacement during development # plain dash + no bold
- Tree-shaking for production builds
- TypeScript support without additional setup
```

### Incorrect

```markdown
Basically, you'll want to simply run `npm install` to easily install all of the dependencies. # filler opener + vague qualifiers
Note that the build process utilizes the powerful and robust Vite bundler, which allows for seamless faster compilation. # "Note that" + buzzwords + "utilize"

It should be noted that configuration lives in `vite.config.ts`. You can very easily modify the `plugins` array. # filler + qualifier

**Key features:**

- **Seamless** hot module replacement during development # excessive bold + buzzword
- **Powerful** tree-shaking for production builds # buzzword
- **Enhanced** TypeScript support without additional setup # buzzword
```
