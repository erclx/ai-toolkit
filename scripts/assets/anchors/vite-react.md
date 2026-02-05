# Vite, React, and Bun project template

This template provides a base for building React applications with Vite and Bun.
It includes built-in tools for testing, environment validation, and automated releases.

---

## AI Toolkit context

This project lives in the `.sandbox` directory of the AI Toolkit.
The `GEMINI.md` file gives the Gemini CLI the context it needs to work with this specific sub-project.

---

## Core features

- **Tech stack**: Uses Vite for development, React for the UI, and Bun for managing dependencies.
- **Environment validation**: Uses Zod to check environment variables at runtime in `src/config/env.ts`.
- **Styling**: Includes Tailwind CSS v4.
- **Architecture**: Groups code by feature or domain.
- **Quality checks**: Runs Husky and Lint-Staged to check code before you commit or push.
- **Automated releases**: Includes scripts to manage versioning and GitHub releases.
- **Testing**: Uses Vitest and jsdom for unit tests.

---

## Installation

Set up the project on your machine:

```bash
git clone https://github.com/your-username/vite-react-template.git my-app
cd my-app
chmod +x scripts/setup.sh && ./scripts/setup.sh

```

The `setup.sh` script renames the project, resets Git history, and deletes itself when finished.

---

## Usage

### Run the development server

```bash
bun run dev

```

### Workflow commands

| Command | Purpose |
| --- | --- |
| `bun run build` | Checks types and creates a production build |
| `bun run lint:fix` | Fixes formatting and linting issues |
| `bun run spell` | Checks spelling with CSpell |
| `bun run test` | Runs tests in watch mode |
| `bun run coverage` | Creates a test coverage report |
| `bun run verify` | Runs types, linting, formatting, and tests |
| `bun run update` | Updates dependencies and runs checks |
| `bun run release` | Bumps the version and creates a release PR |
| `bun run publish` | Creates a GitHub Release and tags the version |

---

## Project structure

```text
src/
├── components/      # Shared UI elements
├── features/        # Code grouped by domain
├── hooks/           # Shared React hooks
├── config/          # Environment validation
├── utils/           # Utility functions
├── lib/             # Third-party integrations
├── test/            # Test mocks and utilities
├── app.tsx          # Root component
└── main.tsx         # Entry point

```

---

## Configuration

The project requires a validated `.env` file to run.

1. **Create the file**:
```bash
cp .env.example .env

```


2. **Add variables**:
Open `.env` and add your values, such as `VITE_API_URL`.
3. **Update the schema**:
If you add new variables, define them in `src/config/env.ts`:

```typescript
const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_BASE_URL: z.string().default('/'),
  // Add new variables here
})

```

---

## Deployment

### GitHub Pages

To deploy to GitHub Pages, use the GitHub CLI and this build command:

```bash
chmod +x ./scripts/verify.sh && ./scripts/verify.sh && bun run build

```

### Release process

1. **Start**: Run `bun run release` to create a release branch.
2. **Merge**: Merge the Pull Request into your main branch.
3. **Finalize**: Run `bun run publish` to create the tag and GitHub Release.

---

## License

This project uses the MIT License.
