# TOOLING BASE REFERENCE

## Runtime

- Use `bun` as package manager and script runner.
- Use `bunx` instead of `npx` for one-off executables.

## Prettier

- Config: `.prettierrc` (JSON) at root.
- Rules: `semi: false`, `singleQuote: true`.
- Add parser overrides for non-standard extensions (e.g., `.mdc` → `markdown`).
- Ignore paths via `.gitignore` — do not create `.prettierignore`.

## Dev Dependencies

- `prettier`, `cspell`, `husky`, `@commitlint/cli`, `@commitlint/config-conventional`.
- Install via `bun add -D`.
- Ensure `.gitignore` contains `node_modules/`.

## CSpell

- Config: `cspell.json` at root.
- Include `version: "0.2"` and `language: "en"`.
- Set `useGitignore: true` to skip ignored paths.
- Dictionary files in `.cspell/`: `project-terms.txt`, `tech-stack.txt`.
- Set `addWords: true` on each dictionary definition.
- Add `ignorePaths: [".cspell/**"]` to avoid self-checking dictionaries.
- Keep dictionary entries sorted alphabetically, one word per line.

## Shell Tooling

- Lint: `shellcheck` with `--severity=warning`.
- Format: `shfmt` with `--indent 2`.
- Config: `.shellcheckrc` with `external-sources=true`.
- Project `.vscode/settings.json` with `"shellcheck.customArgs": ["--severity=warning"]`.

## Commit Lint

- Config: `commitlint.config.js` (ESM default export).
- Extends: `@commitlint/config-conventional`.
- Rules: `header-max-length: 72`, `scope-case: lower-case`, `subject-full-stop: never`, `subject-case: disabled`.
- Format: `<type>(<scope>): <subject>` — imperative mood, no trailing period.

## Husky + Lint-Staged

- Config: `.lintstagedrc` (JSON) at root.
- Hooks in `.husky/`:
  - `pre-commit` → `bunx lint-staged`
  - `commit-msg` → `bunx commitlint --edit "$1"`
  - `pre-push` → `bun run check`
- Lint-staged globs:
  - `**/*.{json,md,mdc}` → `["prettier --write --ignore-path .gitignore", "cspell --no-must-find-files"]`
  - `**/*.sh` → `["shfmt --write --indent 2", "shellcheck --severity=warning"]`

## GitHub

- PR template: `.github/pull_request_template.md`.
- Sections: `## Summary`, `## Key Changes`, `## Technical Context`, `## Testing`.
- Visuals: HTML comment only — never a visible section header.
- Follow `standards/pr.md`: imperative mood, no "This PR" opener, no buzzwords, name specific files and functions.

## Gitignore

- `# System` — `.DS_Store`
- `# Dependencies` — `node_modules/`
- `# Secrets` — `.env`, `.env.*`, `*.local`, `!.env.example`
- `# Gemini` — `.gemini/*`, `!.gemini/settings.json`

## Scripts

- Entry: `scripts/` directory with `verify.sh`, `clean.sh`, `update.sh`, `snapshot.sh`.
- All scripts use logging functions from the bash script reference.
- `verify.sh` — runs format, spell, and shell checks in sequence. Supports `VERIFY_NESTED=true` to suppress timeline boundaries when called by other scripts.
- `clean.sh` — removes `node_modules/`, clears bun cache, reinstalls dependencies fresh.
- `update.sh` — runs `bun update --interactive` then calls `verify.sh` with `VERIFY_NESTED=true` to confirm project health after updates.
- `snapshot.sh` — generates `.claude/PROJECT.md` with a directory tree and `package.json` contents. Tree respects `.gitignore`. Output is ephemeral — add `.claude/PROJECT.md` to `.gitignore`, do not commit it.

## VS Code

- Extensions: `esbenp.prettier-vscode`, `streetsidesoftware.code-spell-checker`, `mkhl.shfmt`, `timonwong.shellcheck`, `mads-hartmann.bash-ide-vscode`.
- Settings: `shellcheck.customArgs: ["--severity=warning"]`.

## Package Scripts

- `check:spell` — runs cspell across all files, shows context on failures.
- `check:format` — checks prettier and shfmt formatting without writing.
- `check:shell` — runs shellcheck at warning severity across all `.sh` files.
- `format` — writes prettier and shfmt formatting in place.
- `prepare` — initializes husky hooks (runs automatically on `bun install`).
- `check` — runs `scripts/verify.sh`, the full verification suite.
- `clean` — runs `scripts/clean.sh`, wipes and reinstalls dependencies.
- `update` — runs `scripts/update.sh`, interactive dependency update with verification.
- `snapshot` — runs `scripts/snapshot.sh`, writes `.claude/PROJECT.md`.
