# README REFERENCE

## RULES

- Hierarchy: H1 title, H2 major sections, H3 subsections.
- Required Sections: Project description, installation/setup, usage examples, support/help resources.
- Optional Sections: Badges (at top), features, contributing (link to `CONTRIBUTING.md`), license (link to `LICENSE`).
- Links: Use relative paths for repository files; use absolute URLs for external resources.
- Code Examples: Include practical usage snippets demonstrating core functionality.
- Context Adaptation: For libraries/tools include API quickstart; for applications/products include usage instructions and configuration options; for CLI tools include command examples with flags.
- Heading Structure: Use proper heading hierarchy to enable GitHub's auto-generated table of contents.
- Spacing: Include one blank line between headers and content.
- Description: Brief overview in 2-3 sentences maximum explaining what the project does.

## CONSTRAINTS

- Do not include full API documentation; link to separate docs instead.
- Do not include license text; reference the `LICENSE` file.
- Do not include detailed contribution guidelines; reference the `CONTRIBUTING.md` file.
- Do not include extensive troubleshooting guides; use wiki or separate documentation.
- Do not use absolute URLs for files within the repository.
- Do not create deeply nested heading structures that harm scannability.
- Do not use horizontal rules or dividers (`---`).

## EXAMPLES

### Template

````markdown
# Project Name

Brief description of what the project does in 2-3 sentences.

## Features

- Key feature highlighting user benefit
- Key feature highlighting user benefit
- Key feature highlighting user benefit

## Installation

```bash
npm install project-name
```

## Usage

```javascript
import { feature } from "project-name"

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

Lightweight authentication library for Node.js applications with OAuth2 and JWT support.

## Features

- OAuth2 provider integration (Google, GitHub, Azure)
- JWT token generation and validation
- Session management with Redis support
- TypeScript support with full type definitions

## Installation

```bash
npm install auth-sdk
```

## Quick Start

```javascript
import { AuthClient } from "auth-sdk"

const client = new AuthClient({
  provider: "google",
  clientId: process.env.CLIENT_ID,
})

const user = await client.authenticate(code)
```

## Documentation

Visit [docs.auth-sdk.dev](https://docs.auth-sdk.dev) for full API reference and guides.

## Support

- Report bugs via [GitHub Issues](../../issues)
- Community support on [Discord](https://discord.gg/example)

## License

[MIT](LICENSE)
````

### Correct (Application/Product)

````markdown
# Terraform Formatter

VSCode extension for formatting and validating Terraform files.

## Features

- Auto-format on save
- Syntax validation with inline diagnostics
- Module explorer in sidebar
- Support for Terraform 1.0+

## Installation

Install from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=example.terraform-formatter).

## Usage

Open a Terraform file and run `Format Document` from the command palette, or enable auto-format on save in settings.

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

This is a seamless and powerful authentication library that allows developers to easily integrate robust OAuth2 functionality into their Node.js applications. It's a game-changer for authentication!

## Why Use This?

Basically, this library is just amazing and will revolutionize how you handle auth. It's super simple to use and very powerful.

## Installation

Simply run the following command to install:

```bash
npm install auth-sdk
```

## API Documentation

### AuthClient Class

The AuthClient class is the main entry point for the library.

#### Constructor

```typescript
constructor(options: AuthOptions)
```

Creates a new AuthClient instance with the provided options.

**Parameters:**

- `options` (AuthOptions): Configuration object
  - `provider` (string): OAuth provider name
  - `clientId` (string): Your client ID
  - `clientSecret` (string): Your client secret
  - `redirectUri` (string): Callback URL

[...500 more lines of detailed API docs...]

## License

MIT License

Copyright (c) 2026 Example Corp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...

[...full license text...]
````
