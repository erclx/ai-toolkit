# Readme reference

## Structure

- H1 title, H2 major sections, H3 subsections. Maintain proper hierarchy for GitHub's auto-generated table of contents.
- Use sentence case for all headings (proper nouns and product names retain their casing)
- Project description in plain text directly under H1. Keep it to 2-3 sentences.
- Do not create deeply nested heading structures that harm scannability
- Do not use horizontal rules or dividers (`---`)

## Sections

- Required: project description, installation/setup, usage examples, support/help resources
- Optional: badges (at top, before description), features, contributing (link to `CONTRIBUTING.md`), license (link to `LICENSE`)
- Do not include full API documentation. Link to separate docs instead.
- Do not include license text. Reference the `LICENSE` file.
- Do not include detailed contribution guidelines. Reference `CONTRIBUTING.md`.
- Do not include extensive troubleshooting guides. Use a wiki or separate documentation.

## Content

- Use relative paths for repository files. Use absolute URLs for external resources.
- Include practical usage snippets for core functionality
- For libraries/tools: include API quickstart
- For applications/products: include usage instructions and configuration options
- For CLI tools: include command examples with flags

## Examples

### Template

````markdown
# Project Name

Brief description of what the project does in 2-3 sentences.

## Features

- Key feature highlighting user benefit
- Key feature highlighting user benefit

## Installation

```bash
npm install project-name
```

## Usage

```javascript
import { feature } from 'project-name'

feature.doSomething()
```

## Documentation

See the [full documentation](https://docs.example.com) for detailed API reference.

## Support

- Open an issue for bug reports
- Check [existing issues](../../issues) before creating new ones

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
````

### Correct

````markdown
# Auth SDK

Lightweight authentication library for Node.js with OAuth2 and JWT support.

## Features

- OAuth2 provider integration (Google, GitHub, Azure)
- JWT token generation and validation
- Session management with Redis support
- TypeScript support with full type definitions

## Installation

```bash
npm install auth-sdk
```

## Quick start

```javascript
import { AuthClient } from 'auth-sdk'

const client = new AuthClient({
  provider: 'google',
  clientId: process.env.CLIENT_ID,
})

const user = await client.authenticate(code)
```

## Documentation

Visit [docs.auth-sdk.dev](https://docs.auth-sdk.dev) for full API reference.

## Support

- Report bugs via [GitHub Issues](../../issues)
- Community support on [Discord](https://discord.gg/example)

## License

[MIT](LICENSE)
````

### Incorrect

````markdown
# Auth SDK

This is a seamless and powerful authentication library that allows developers to easily integrate robust OAuth2 functionality.

## Why Use This?

Basically, this library is just amazing and will revolutionize how you handle auth.

## Installation

Simply run the following command to install:

```bash
npm install auth-sdk
```

## API Documentation

### AuthClient Class

#### Constructor

constructor(options: AuthOptions)

[...full API docs inline, should link to external docs...]

## License

MIT License

Copyright (c) 2026 Example Corp

[...full license text, should reference LICENSE file...]
````
