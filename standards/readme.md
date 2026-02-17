# README REFERENCE

## Structure

- H1 title, H2 major sections, H3 subsections
- Project description in plain text directly under H1; 2-3 sentences maximum
- Use proper heading hierarchy to enable GitHub's auto-generated table of contents
- Do not create deeply nested heading structures that harm scannability
- Do not use horizontal rules or dividers (`---`)

## Sections

- Required: project description, installation/setup, usage examples, support/help resources
- Optional: badges (at top, before description), features, contributing (link to `CONTRIBUTING.md`), license (link to `LICENSE`)
- Do not include full API documentation; link to separate docs instead
- Do not include license text; reference the `LICENSE` file
- Do not include detailed contribution guidelines; reference `CONTRIBUTING.md`
- Do not include extensive troubleshooting guides; use wiki or separate documentation

## Content

- Use relative paths for repository files; use absolute URLs for external resources
- Do not use absolute URLs for files within the repository
- Include practical usage snippets demonstrating core functionality
- For libraries/tools: include API quickstart
- For applications/products: include usage instructions and configuration options
- For CLI tools: include command examples with flags

## EXAMPLES

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

### Correct (Library)

````markdown
# Auth SDK

Lightweight authentication library for Node.js with OAuth2 and JWT support. # 1 sentence, plain text, under H1

## Features

- OAuth2 provider integration (Google, GitHub, Azure) # user benefit, no buzzwords
- JWT token generation and validation
- Session management with Redis support
- TypeScript support with full type definitions

## Installation

```bash
npm install auth-sdk
```

## Quick Start

```javascript
import { AuthClient } from 'auth-sdk'

const client = new AuthClient({
  provider: 'google',
  clientId: process.env.CLIENT_ID,
})

const user = await client.authenticate(code)    # practical snippet, core functionality
```

## Documentation

Visit [docs.auth-sdk.dev](https://docs.auth-sdk.dev) for full API reference. # links to external docs, not inline

## Support

- Report bugs via [GitHub Issues](../../issues) # relative path for repo link
- Community support on [Discord](https://discord.gg/example)

## License

[MIT](LICENSE) # references file, no license text
````

### Correct (Application/Product)

````markdown
# Terraform Formatter

VSCode extension for formatting and validating Terraform files. # plain text description, concise

## Features

- Auto-format on save
- Syntax validation with inline diagnostics
- Module explorer in sidebar
- Support for Terraform 1.0+

## Installation

Install from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=example.terraform-formatter).

## Usage

Open a Terraform file and run `Format Document` from the command palette, or enable auto-format on save in settings. # practical usage, no hand-holding

### Configuration

```json
{
  "terraform.formatOnSave": true,
  "terraform.path": "/usr/local/bin/terraform"
}
```

## Requirements

- VSCode 1.80.0 or higher
- Terraform CLI installed

## Support

Report issues on [GitHub](../../issues).

## License

[MIT](LICENSE)
````

### Incorrect

````markdown
# Auth SDK

This is a seamless and powerful authentication library that allows developers to easily integrate robust OAuth2 functionality. # buzzwords + vague qualifiers

## Why Use This?

Basically, this library is just amazing and will revolutionize how you handle auth. # filler + buzzwords

## Installation

Simply run the following command to install: # "Simply" filler

```bash
npm install auth-sdk
```

## API Documentation

### AuthClient Class

#### Constructor

constructor(options: AuthOptions) # full API docs inline, should link to external docs instead

[...500 more lines of detailed API docs...]

## License

MIT License

Copyright (c) 2026 Example Corp # full license text, should reference LICENSE file only

[...full license text...]
````
