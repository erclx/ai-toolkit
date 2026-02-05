# AI Toolkit - Gemini CLI Extension

The AI Toolkit is a Gemini CLI extension built for codebase governance and automation.
It automates Git operations, enforces code standards, and manages sandboxed testing environments.

---

## Installation and setup

### Install the extension

Link the toolkit to your Gemini CLI:

```bash
git clone git@github.com:erclx/ai-toolkit.git
cd ai-toolkit
gemini extensions link .

```

### Apply governance rules

Install the project rules:

```bash
/ai-toolkit.setup:rules

```

### Build and lint scripts

| Command | Action |
| --- | --- |
| `npm run build:docs` | Compiles documentation |
| `npm run build:rules` | Compiles governance rules |
| `npm run lint:spelling` | Checks spelling across the project |

---

## Testing and sandboxing

The toolkit manages test environments through sandboxing to keep your main system clean.

- **Management**: The `scripts/manage-test.sh` script handles sandbox creation.
- **Stages**: Commands run in predefined sequences found in `scripts/stages`.
- **Environment**: Sandboxes use `gemini-2.5-flash` as the default model.
- **Context**: Use "anchor" repositories to provide specific starting points for tests.

---

## Development conventions

### Commit message format

Use the conventional commit format with a strict lowercase requirement.

- **Template**: `<type>(<scope>): <subject>`
- **Casing**: Use 100% lowercase for the entire message.
- **Scope**: Use a directory name or system component (e.g., `scripts`).
- **Limit**: Keep subjects under 72 characters and do not use trailing periods.

### Core engineering principles

- **Zero bloat**: Implement only what you need now.
- **Zero comments**: Code must be self-explanatory.
- **Why over what**: Use comments only to explain intent, not logic.
- **Native first**: Avoid adding dependencies if native platform tools exist.
- **Idempotency**: Ensure scripts are safe to run multiple times.
- **Temporary state**: Store all transient data in `.gemini/.tmp/`.

### AI communication standards

- Use the imperative voice for all descriptions.
- Use ventilated prose (one sentence per line).
- Avoid emojis and marketing language.
