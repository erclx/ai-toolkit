# AI Toolkit

The AI core toolkit transforms any codebase into a high-governance environment.
This extension provides infrastructure for automated governance, semantic versioning, and architectural discovery.

---

## Key features

- **Architectural reconnaissance:** Map project topology, stack intent, and health metrics.
- **Governance management:** Install and test project-specific Cursor rules.
- **Version control automation:** Generate atomic, lowercase conventional commits and PR descriptions.
- **Release management:** Curate semantic changelogs by filtering internal technical noise.
- **Quality assurance:** Agentic spell-checking and dictionary management via CSpell.
- **Infrastructure setup:** Configure zero-trust `.gemini` environments and CSpell scaffolding.

---

## Operations

The toolkit uses shell scripts orchestrated by the Gemini CLI.

### Core scripts

- **Build rules:** Compile governance rules for local use.

```bash
bun run build:rules

```

- **Lint spelling:** Execute spell-check across the codebase.

```bash
bun run lint:spelling

```

### Command execution

Invoke tools via the Gemini CLI using the standard namespace pattern:
`gemini /ai-toolkit.<category>:<command>`

---

## Development conventions

### Technical standards

- **Zero-bloat:** Prioritize technical density and efficiency over narrative fluff.
- **Ghost folder:** Isolate project state within `.gemini/.tmp/` to prevent context pollution.
- **Immutable history:** Treat commits and PRs as permanent technical records.

### Git workflow

- **Analysis:** Staged changes are analyzed to ensure commit specificity.
- **Conventional commits:** Use strictly lowercase, scoped messages: `type(scope): subject`.
- **Documentation-driven PRs:** Document only what exists in the code today.

---

## Project structure

- `commands/`: TOML configurations for the Gemini CLI.
- `scripts/`: Implementation logic via shell stages.
- `gemini-extension.json`: Extension metadata and context anchoring.
- `.geminiignore`: Whitelist and isolation rules for AI agents.
